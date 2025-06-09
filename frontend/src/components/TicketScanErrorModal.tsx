import React from 'react';
import { Dialog } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

interface TicketScanErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails: {
    bookNumber: string;
    gameName: string;
    yesterdayTicket: string;
    currentTicket: string;
  } | null;
}

const TicketScanErrorModal: React.FC<TicketScanErrorModalProps> = ({
  isOpen,
  onClose,
  errorDetails
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container for centering */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Invalid Ticket Number
            </Dialog.Title>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">
              There appears to be an inconsistency in the ticket scanning sequence for:
            </p>
            {errorDetails && (
              <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Game: {errorDetails.gameName}</p>
                <p className="text-sm font-medium text-gray-700">Book: {errorDetails.bookNumber}</p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Yesterday's last scanned ticket: {errorDetails.yesterdayTicket}</p>
                  <p>Current attempted scan: {errorDetails.currentTicket}</p>
                </div>
              </div>
            )}
            <p className="mt-2 text-sm text-red-600">
              The current ticket number cannot be higher than yesterday's ticket number. 
              This might indicate an error in the scanning sequence.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TicketScanErrorModal; 