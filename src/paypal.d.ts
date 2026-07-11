// PayPal SDK global type declarations
interface Window {
  paypal?: {
    Buttons: (config: {
      style?: Record<string, string>;
      createOrder?: (data: unknown, actions: { order: { create: (opts: unknown) => Promise<string> } }) => Promise<string>;
      onApprove?: (data: unknown, actions: unknown) => Promise<void>;
      onError?: (err: unknown) => void;
    }) => { render: (container: HTMLElement) => void };
  };
}
