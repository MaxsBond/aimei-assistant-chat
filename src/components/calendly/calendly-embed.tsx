import React, { useEffect } from 'react';

interface CalendlyEmbedProps {
  url?: string;
}

const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({ 
  url = "https://calendly.com/maxsbond/support" 
}) => {
  useEffect(() => {
    // Load the Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup function to remove the script when component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div 
      className="calendly-inline-widget" 
      data-url={url}
      style={{ minWidth: "320px", height: "700px" }}
    />
  );
};

export default CalendlyEmbed; 