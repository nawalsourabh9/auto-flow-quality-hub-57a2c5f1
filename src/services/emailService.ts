
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export const sendEmail = async ({
  to,
  subject,
  body,
  isHtml = false,
  cc,
  bcc,
  replyTo
}: SendEmailParams) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to,
        subject,
        body,
        isHtml,
        cc,
        bcc,
        replyTo
      }
    });

    if (error) {
      console.error("Email sending error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
};
