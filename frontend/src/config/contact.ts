// Contact configuration — replace WHATSAPP_NUMBER with your real number (country code, no +)
// Set to provided number: country code 234, local number 9026642320
export const WHATSAPP_NUMBER = "2349026642320";

export const formatWhatsAppLink = (n: string) => {
  const digits = n.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
};

export default {
  WHATSAPP_NUMBER,
  formatWhatsAppLink,
};
