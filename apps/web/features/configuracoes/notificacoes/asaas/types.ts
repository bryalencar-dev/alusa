export type NotificationEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_DUEDATE_WARNING'
  | 'SEND_LINHA_DIGITAVEL'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_RECEIVED';

export interface NotificationPreference {
  event: NotificationEvent;
  scheduleOffset: number;
  enabled: boolean;
  emailEnabledForProvider: boolean;
  smsEnabledForProvider: boolean;
  emailEnabledForCustomer: boolean;
  smsEnabledForCustomer: boolean;
  whatsappEnabledForCustomer: boolean;
  phoneCallEnabledForCustomer: boolean;
}

export type ChannelKey = keyof Pick<
  NotificationPreference,
  | 'emailEnabledForProvider'
  | 'smsEnabledForProvider'
  | 'emailEnabledForCustomer'
  | 'smsEnabledForCustomer'
  | 'whatsappEnabledForCustomer'
  | 'phoneCallEnabledForCustomer'
>;
