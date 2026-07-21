<template>
  <div
    class="md:mx-5 md:my-4 flex items-center justify-between text-lg-medium mx-6 !mb-0 !my-3"
  >
    <div class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">
      {{ title }}
    </div>
    <Dropdown
      v-if="title == 'Calls'"
      :options="callActions"
      @click.stop
      placement="right"
    >
      <template v-slot="{ open }">
        <Button variant="subtle" class="flex items-center gap-1">
          <template #prefix>
            <FeatherIcon name="plus" class="h-4 w-4" />
          </template>
          <span>{{ __("New") }}</span>
          <template #suffix>
            <FeatherIcon
              :name="open ? 'chevron-up' : 'chevron-down'"
              class="h-4 w-4"
            />
          </template>
        </Button>
      </template>
    </Dropdown>
    <!-- LCS: Alle / Kommentare / Mails filter, shown on the conversation tab -->
    <div
      v-if="title == 'Konversation'"
      class="inline-flex items-center gap-0.5 rounded-lg bg-surface-gray-2 p-0.5 text-sm font-normal"
    >
      <button
        v-for="opt in conversationFilterOptions"
        :key="opt.value"
        class="rounded-md px-2.5 py-1 transition-colors"
        :class="
          conversationFilter === opt.value
            ? 'bg-surface-white font-medium text-ink-gray-9 shadow-sm'
            : 'text-ink-gray-6 hover:text-ink-gray-8'
        "
        @click="conversationFilter = opt.value"
      >
        {{ __(opt.label) }}
      </button>
    </div>
  </div>
  <CallLogModal
    v-model="showCallLogModal"
    :ticketId="ticket.value?.name"
    @after-insert="refreshTicket"
  />
</template>

<script setup lang="ts">
import { PhoneIcon } from "@/components/icons";
import CallLogModal from "@/pages/call-logs/CallLogModal.vue";
import { conversationFilter } from "@/pages/ticket/modalStates";
import { __ } from "@/translation";
import { TicketSymbol } from "@/types";
import { Dropdown } from "frappe-ui";
import { computed, h, inject, ref } from "vue";
defineProps({
  title: {
    type: String,
    required: true,
  },
});

const makeCall = inject<() => void>("makeCall");
const refreshTicket = inject<() => void>("refreshTicket");
const showCallLogModal = ref(false);
const ticket = inject(TicketSymbol)!;

const conversationFilterOptions = [
  { value: "alle", label: "Alle" },
  { value: "comment", label: "Kommentare" },
  { value: "email", label: "Mails" },
] as const;

const callActions = computed(() => {
  let actions = [
    {
      icon: h(PhoneIcon, { class: "h-4 w-4" }),
      label: __("Make a Call"),
      onClick: () => makeCall(),
    },
    {
      icon: "lucide-edit-3",
      label: __("Log a Call"),
      onClick: () => {
        showCallLogModal.value = true;
      },
    },
  ];
  return actions;
});
</script>

<style scoped></style>
