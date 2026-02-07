import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          background: 'white',
          color: '#2D2721',
          border: '1px solid rgba(139, 115, 85, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
          fontFamily: 'DM Sans, sans-serif',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
