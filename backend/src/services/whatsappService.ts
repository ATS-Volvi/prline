import { Associate, Workstation, Shift, ProductionLine, AuditLog } from '../../../database/models/models/models';

export async function sendWhatsAppNotification(
  userId: string,
  associateId: string,
  date: string,
  shiftId: string,
  workstationId: string,
  lineId: string
) {
  try {
    const assoc = await Associate.findOne({ where: { id: associateId, userId } });
    if (!assoc) {
      console.warn(`Associate ${associateId} not found, skipping WhatsApp.`);
      return;
    }

    const ws = await Workstation.findOne({ where: { id: workstationId, userId } });
    const shift = await Shift.findOne({ where: { id: shiftId, userId } });
    const line = await ProductionLine.findOne({ where: { id: lineId, userId } });

    const associateName = assoc.name;
    const phoneNumber = assoc.phoneNumber || '+919876543201'; // Fallback seed number
    const workstationName = ws ? ws.name : workstationId;
    const shiftName = shift ? shift.name : shiftId;
    const lineName = line ? line.name : lineId;

    const message = `Hello ${associateName}, you have been allocated to workstation "${workstationName}" for "${shiftName}" on "${lineName}" on ${date}. Please report on time. - PepsiCo Plant Admin`;

    console.log(`[WHATSAPP SERVICE] Sending message to ${phoneNumber}: "${message}"`);

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number

    if (twilioSid && twilioAuthToken && typeof fetch !== 'undefined') {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: `whatsapp:${phoneNumber}`,
            Body: message
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          console.error(`Twilio WhatsApp delivery failed: ${errText}`);
        } else {
          console.log(`Twilio WhatsApp sent successfully to ${phoneNumber}`);
        }
      } catch (fetchErr) {
        console.error(`Network error calling Twilio:`, fetchErr);
      }
    }

    // Insert an AuditLog entry so the supervisor can inspect the text sent in the UI
    await AuditLog.create({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType: 'WHATSAPP_NOTIFICATION',
      details: `WhatsApp sent to ${associateName} (${phoneNumber}): "${message}"`,
      userId: userId || 'SYSTEM',
      userRole: 'System Agent'
    });

  } catch (err) {
    console.error(`Error in sendWhatsAppNotification:`, err);
  }
}
