import React from 'react';

interface TicketConfirmationEmailProps {
  eventName: string;
  ticketNumber: string;
  eventDate: string;
  location?: string;
  attendeeName?: string;
  ticketUrl: string;
  merchantName: string;
}

export default function TicketConfirmationEmail({
  eventName,
  ticketNumber,
  eventDate,
  location,
  attendeeName,
  ticketUrl,
  merchantName,
}: TicketConfirmationEmailProps) {
  const emailStyles = `
    .tc-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .tc-h1 { color: #333; }
    .tc-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .tc-box-p { margin: 0 0 10px 0; }
    .tc-link { color: #0066cc; text-decoration: none; }
    .tc-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="tc-container">
        <h1 className="tc-h1">Your Ticket Confirmation</h1>
        <p>Thank you for your purchase! Your ticket for {eventName} is confirmed.</p>

        <div className="tc-box">
          <p className="tc-box-p">
            <strong>Ticket Number:</strong> {ticketNumber}
          </p>
          <p className="tc-box-p">
            <strong>Event:</strong> {eventName}
          </p>
          <p className="tc-box-p">
            <strong>Date & Time:</strong> {new Date(eventDate).toLocaleString()}
          </p>
          {location && (
            <p className="tc-box-p">
              <strong>Location:</strong> {location}
            </p>
          )}
          {attendeeName && (
            <p className="tc-box-p">
              <strong>Attendee:</strong> {attendeeName}
            </p>
          )}
        </div>

        <p>
          <a href={ticketUrl} className="tc-link">
            View your ticket →
          </a>
        </p>

        <p className="tc-footer">
          This is your ticket confirmation. Please bring this email or show your ticket QR code at the event entrance.
          <br />
          <br />
          Organized by {merchantName}
        </p>
      </div>
    </>
  );
}
