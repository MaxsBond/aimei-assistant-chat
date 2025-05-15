import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CalendlyEmbed from './calendly-embed';

interface CalendlyTriggerProps {
  buttonText?: string;
  dialogTitle?: string;
  calendlyUrl?: string;
}

const CalendlyTrigger: React.FC<CalendlyTriggerProps> = ({
  buttonText = "Schedule a Meeting",
  dialogTitle = "Book a Meeting",
  calendlyUrl = "https://calendly.com/maxsbond/support"
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="default" 
        onClick={() => setOpen(true)}
        className="mt-2"
      >
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <CalendlyEmbed url={calendlyUrl} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendlyTrigger; 