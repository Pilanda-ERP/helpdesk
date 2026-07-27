<template>
  <div class="flex h-full flex-col">
    <div class="shrink-0 px-4 pb-4 flex flex-col">
      <!-- User avatar with buttons -->
      <TicketContact />
      <!-- Core Fields — LCS order: Kategorie, Priorität, Status,
           Gemeldet von, Kontakt, Gemeldet am, Team, Bearbeiter -->
      <div class="mt-4">
        <template v-for="row in coreRows" :key="row.key">
          <!-- read-only info row -->
          <div
            v-if="row.type === 'info'"
            class="flex items-center justify-between gap-2 py-1.5"
          >
            <span class="text-xs text-ink-gray-5 shrink-0">{{
              __(row.label)
            }}</span>
            <span
              class="text-sm text-ink-gray-8 text-right truncate min-w-0"
              :title="String(row.value)"
              >{{ row.value }}</span
            >
          </div>
          <!-- Priorität + Status side by side -->
          <div
            v-else-if="row.type === 'linkgroup'"
            class="flex gap-2 items-start max-w-full mb-3 mt-1.5"
          >
            <Link
              v-for="field in row.fields"
              :key="field.fieldname"
              :ref="(el) => setFieldRef(field.fieldname, el)"
              class="form-control-core flex-1 min-w-0"
              :id="field.fieldname"
              :page-length="10"
              :label="field.label"
              :placeholder="field.placeholder"
              :doctype="field.doctype"
              :modelValue="field.value"
              :required="field.required"
              @update:model-value="
                (val:string) => handleFieldUpdate(field.fieldname, val, true)
              "
            />
          </div>
          <!-- Team (single editable link) -->
          <div v-else-if="row.type === 'link' && row.field" class="mb-3 mt-1.5">
            <Link
              :ref="(el) => setFieldRef(row.field.fieldname, el)"
              class="form-control-core w-full"
              :id="row.field.fieldname"
              :page-length="10"
              :label="row.field.label"
              :placeholder="row.field.placeholder"
              :doctype="row.field.doctype"
              :modelValue="row.field.value"
              :required="row.field.required"
              @update:model-value="
                (val:string) => handleFieldUpdate(row.field.fieldname, val, true)
              "
            />
          </div>
        </template>

        <!-- Bearbeiter -->
        <AssignTo />
      </div>
    </div>

    <!-- Scrollable sections: Ticket Info + Recent / Similar Tickets -->
    <div
      class="border-t flex-1 min-h-0 overflow-y-auto divide-y-[1px]"
      v-if="Boolean(customFields.length) || showRecentSimilarTickets"
    >
      <!-- Ticket Info (custom fields) -->
      <div v-if="Boolean(customFields.length)">
        <Section label="Weitere Details" :opened="true">
          <template #header="{ opened, toggle }">
            <div
              class="flex gap-2.5 items-center justify-between sticky top-0 bg-surface-base z-10 px-4 py-4 cursor-pointer"
              @click="toggle"
            >
              <span class="text-ink-gray-8 font-semibold text-base select-none">
                {{ __("Weitere Details") }}
              </span>
              <LucideChevronRight
                class="size-4 text-ink-gray-6"
                :class="{ 'rotate-90': opened }"
              />
            </div>
          </template>
          <div
            class="space-y-1.5 px-4 mb-2 mt-0.5"
            v-if="Boolean(customFields.length)"
          >
            <template v-for="field in customFields">
              <TicketField
                v-if="field.visible"
                :key="field.fieldname"
                :field="field"
                :value="field.value"
                @change="
                  ({ fieldname, value }) => handleFieldUpdate(fieldname, value)
                "
              />
            </template>
          </div>
        </Section>
      </div>

      <!-- Recent / Similar Tickets -->
      <template v-if="showRecentSimilarTickets">
        <div v-for="section in sections" :key="section.label">
          <Section
            :label="section.label"
            :hideLabel="section.hideLabel"
            :opened="section.opened"
          >
            <template #header="{ opened, toggle }">
              <div
                class="flex gap-2.5 items-center justify-between sticky top-0 bg-surface-base z-10 px-4 py-4 cursor-pointer"
                @click="toggle"
              >
                <Tooltip :text="section.tooltipMessage">
                  <span
                    class="text-ink-gray-8 font-semibold text-base select-none"
                  >
                    {{ __(section.label) }}
                  </span>
                </Tooltip>
                <LucideChevronRight
                  class="size-4 text-ink-gray-6"
                  :class="{ 'rotate-90': opened }"
                />
              </div>
            </template>
            <ul class="pt-0 px-5 divide-y divide-outline-gray-1 pb-4">
              <li
                v-for="t in section.tickets"
                :key="t.name"
                @click="openTicket(t.name)"
              >
                <div
                  class="-mx-2 px-2 py-3 cursor-pointer rounded hover:bg-surface-gray-2 transition-colors"
                >
                  <p class="text-sm font-base text-ink-gray-9 truncate mb-2">
                    {{ t.subject }}
                  </p>
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm text-ink-gray-5 shrink-0">
                      {{ formatDate(t.creation as string) + " · " }}
                      <span class="">{{ "#" + t.name }}</span>
                    </p>
                    <span
                      class="text-xs px-2 py-0.5 font-base shrink-0 rounded-sm"
                      :class="getStatusColor(t.status as string)"
                    >
                      {{ t.status }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </Section>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link } from "@/components";
import { parseField } from "@/composables/formCustomisation";
import { useNotifyTicketUpdate } from "@/composables/realtime";
import { useShortcut } from "@/composables/shortcuts";
import { getMeta } from "@/stores/meta";
import { useTicketStatusStore } from "@/stores/ticketStatus";
import {
  ActivitiesSymbol,
  AssigneeSymbol,
  CustomizationSymbol,
  FieldValue,
  RecentSimilarTicketsSymbol,
  TicketSymbol,
} from "@/types";
import dayjs from "dayjs";
import { Tooltip } from "frappe-ui";
import { computed, inject, ref } from "vue";
import LucideChevronRight from "~icons/lucide/chevron-right";
import Section from "../Section.vue";
import TicketField from "../TicketField.vue";
import AssignTo from "./AssignTo.vue";
import TicketContact from "./TicketContact.vue";

const ticket = inject(TicketSymbol)!;
const assignees = inject(AssigneeSymbol)!;
const customizations = inject(CustomizationSymbol)!;
const activities = inject(ActivitiesSymbol)!;
const recentSimilarTickets = inject(RecentSimilarTicketsSymbol)!;
const { getFields, getField } = getMeta("HD Ticket");
const { notifyTicketUpdate } = useNotifyTicketUpdate(ticket.value?.name);

const dateFormat = window.date_format;
const { getStatus, colorMap } = useTicketStatusStore();

// LCS core rows in the order agreed with the team:
// Kategorie, Priorität, Status, Gemeldet von, Kontakt, Gemeldet am,
// Team, Bearbeiter. Priorität/Status/Team stay editable Link fields
// (Status is set here in the sidebar, not the top-right header);
// Kategorie/Gemeldet von/Kontakt/Gemeldet am are read-only info rows;
// Bearbeiter is handled by the <AssignTo /> component below.
const coreRows = computed(() => {
  const doc = ticket.value?.doc || {};
  const linkFields: Record<string, any> = {};
  ["priority", "status", "agent_group"].forEach((n) => {
    let f = getField(n);
    if (!f) return;
    f = parseField(f, doc);
    // cant handle required depends on as we directly set the value in DB
    f["required"] = f.reqd;
    f["ref"] = f.fieldname;
    f = getFieldInFormat(f, f);
    f["visible"] = true;
    linkFields[n] = f;
  });

  const katMap: Record<string, string> = { Kunde: "Kundenanliegen" };
  const kat = doc.custom_lcs_kategorie as string;

  return [
    { type: "info", key: "kategorie", label: "Kategorie", value: kat ? katMap[kat] || kat : "—" },
    { type: "linkgroup", key: "prio-status", fields: [linkFields.priority, linkFields.status].filter(Boolean) },
    { type: "info", key: "raised_by", label: "Gemeldet von", value: doc.raised_by || "—" },
    { type: "info", key: "contact", label: "Kontakt", value: doc.contact || "—" },
    { type: "info", key: "creation", label: "Gemeldet am", value: doc.creation ? formatDate(doc.creation) : "—" },
    { type: "link", key: "agent_group", field: linkFields.agent_group || null },
  ];
});

// "Weitere Details" per category — only the fields relevant to the
// ticket's LCS category are shown (not every custom field).
const CATEGORY_FIELDS: Record<string, string[]> = {
  Idee: [
    "custom_idee_typ",
    "custom_geschaetzter_nutzen",
    "custom_betroffene_bereiche",
    "custom_schwerpunkt_themen",
  ],
  Problem: ["custom_fachbereich", "custom_kunde_betroffen", "custom_kundenname"],
  Notfall: ["custom_notfall_art", "custom_standort"],
  Kunde: [
    "custom_anliegen_art",
    "custom_kunde_firma",
    "custom_ansprechpartner",
    "custom_meldender_kontakt",
    "custom_projektnummer",
    "custom_fachbereich",
    "custom_eingangskanal",
  ],
};

const customFields = computed(() => {
  const fieldsMeta = getFields();
  if (!fieldsMeta || fieldsMeta.length === 0) {
    return [];
  }

  if (!customizations.value.data || customizations.value.loading) return [];
  let customFields = customizations.value.data?.custom_fields || [];
  const _coreFields = [
    "ticket_type",
    "priority",
    "customer",
    "agent_group",
    "subject",
    "status",
  ];
  customFields = customFields.filter((f) => !_coreFields.includes(f.fieldname));

  // Category-specific whitelist; fall back to all when unknown.
  const kat = ticket.value.doc?.custom_lcs_kategorie as string;
  const allowed = CATEGORY_FIELDS[kat];
  if (allowed) {
    customFields = customFields
      .filter((f) => allowed.includes(f.fieldname))
      .sort(
        (a, b) => allowed.indexOf(a.fieldname) - allowed.indexOf(b.fieldname)
      );
  }
  let _customFields = customFields
    .map((f) => {
      let fieldMeta = getField(f.fieldname);
      if (!fieldMeta) return null;

      fieldMeta = parseField(fieldMeta, ticket.value.doc);
      // cant handle required depends on as we directly set the value in DB
      fieldMeta["required"] = fieldMeta.reqd || f.required;

      return getFieldInFormat(f, fieldMeta);
    })
    .filter(Boolean);
  return _customFields;
});

const sections = computed(() => {
  if (recentSimilarTickets.value.loading || !recentSimilarTickets.value.data) {
    return [];
  }
  const recentTickets = recentSimilarTickets.value?.data?.recent_tickets || [];
  const similarTickets =
    recentSimilarTickets.value?.data?.similar_tickets || [];
  const _sections = [];
  if (recentTickets.length) {
    _sections.push({
      label: "Recent Tickets",
      tooltipMessage: "Tickets recently raised by this contact/customer",
      hideLabel: false,
      opened: true,
      tickets: recentTickets,
    });
  }
  if (similarTickets.length) {
    _sections.push({
      label: "Similar Tickets",
      tooltipMessage: "Tickets with similar queries",
      hideLabel: false,
      opened: true,
      tickets: similarTickets,
    });
  }
  return _sections;
});

function getStatusColor(status: string) {
  let { color } = getStatus(status);
  return colorMap[color] ?? colorMap["Default"];
}

function formatDate(date: string) {
  return dayjs(date).format(dateFormat.toUpperCase());
}

function openTicket(name: string) {
  let url = window.location.origin + "/helpdesk/tickets/" + name;
  window.open(url, "_blank");
}

function getFieldInFormat(fieldTemplate, fieldMeta) {
  return {
    label: fieldMeta?.label || fieldTemplate.fieldname,
    value: ticket.value.doc[fieldTemplate.fieldname],
    fieldtype: fieldMeta?.fieldtype,
    doctype: fieldMeta?.options || "",
    options: fieldMeta?.options || "",
    placeholder:
      fieldTemplate.placeholder ||
      `Enter ${fieldMeta?.label || fieldTemplate.fieldname}`,
    readonly: Boolean(fieldMeta.read_only),
    disabled: Boolean(fieldMeta.read_only),
    url_method: fieldTemplate.url_method || "",
    fieldname: fieldTemplate.fieldname,
    required: fieldTemplate.required || fieldMeta?.required || false,
    visible:
      fieldMeta.display_via_depends_on &&
      !fieldMeta.hidden &&
      (!!ticket.value.doc[fieldTemplate.fieldname] || !fieldMeta.read_only),
  };
}

const normalize = (v: string | FieldValue) =>
  v === null || v === undefined ? "" : v;

function handleFieldUpdate(
  fieldname: string,
  value: FieldValue,
  isCoreFieldUpdated = false
) {
  if (normalize(ticket.value.doc[fieldname]) == normalize(value)) return;
  if (isCoreFieldUpdated) {
    const label = getField(fieldname)?.label || fieldname;
    notifyTicketUpdate(label, value as string);
  }
  ticket.value.setValue.submit(
    { [fieldname]: value },
    {
      onSuccess: () => {
        // TODO: emit the event for notification to listeners
        if (fieldname === "agent_group") {
          assignees.value.reload();
        }
        activities.value.reload();
      },
    }

    //show error toast
  );
}

const fieldRefs = ref<Record<string, any>>({});

const setFieldRef = (fieldname: string, el: any) => {
  if (el) {
    fieldRefs.value[fieldname] = el;
  }
};

// LCS: Recent / Similar Tickets removed from the sidebar per review.
const showRecentSimilarTickets = computed(() => false);

useShortcut("t", () => {
  fieldRefs.value?.ticket_type?.$el?.querySelector("button")?.click();
});

useShortcut("p", () => {
  fieldRefs.value?.priority?.$el?.querySelector("button")?.click();
});

useShortcut({ key: "t", shift: true }, () => {
  fieldRefs.value?.agent_group?.$el?.querySelector("button")?.click();
});
</script>

<style scoped>
:deep(.form-control-core button) {
  @apply text-base rounded h-7 py-1.5 border border-outline-gray-2 bg-surface-base placeholder-ink-gray-4 hover:border-outline-gray-3 hover:shadow-sm focus:bg-surface-base focus:border-outline-gray-4 focus:shadow-sm focus:ring-0 focus-visible:ring-0 text-ink-gray-8 transition-colors w-full dark:[color-scheme:dark];
}
:deep(.form-control-core button > div) {
  @apply truncate;
}

:deep(.form-control-core div) {
  width: 100%;
  display: flex;
}
</style>
