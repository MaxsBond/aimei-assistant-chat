/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            h1: {
              color: 'hsl(var(--foreground))',
              fontWeight: '700',
              fontSize: '1.875rem',
              marginTop: '1.5rem',
              marginBottom: '1rem',
              lineHeight: '1.2',
              '&:first-child': {
                marginTop: '0',
              },
            },
            h2: {
              color: 'hsl(var(--foreground))',
              fontWeight: '700',
              fontSize: '1.5rem',
              marginTop: '1.25rem',
              marginBottom: '0.75rem',
              lineHeight: '1.3',
            },
            h3: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1rem',
              marginBottom: '0.5rem',
              lineHeight: '1.4',
            },
            h4: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '1rem',
              marginTop: '0.75rem',
              marginBottom: '0.5rem',
            },
            h5: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
              fontSize: '0.875rem',
              marginTop: '0.75rem',
              marginBottom: '0.25rem',
            },
            h6: {
              color: 'hsl(var(--foreground))',
              fontWeight: '500',
              fontSize: '0.875rem',
              marginTop: '0.75rem',
              marginBottom: '0.25rem',
              fontStyle: 'italic',
            },
            pre: {
              padding: '1rem',
              borderRadius: '0.375rem',
              backgroundColor: 'rgb(39 39 42)',
            },
            code: {
              padding: '0.25rem',
              borderRadius: '0.25rem',
              backgroundColor: 'rgb(39 39 42)',
            },
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--primary) / 0.8)',
              },
            },
            blockquote: {
              borderLeftColor: 'hsl(var(--primary) / 0.3)',
              fontStyle: 'italic',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.625em',
              li: {
                position: 'relative',
                paddingLeft: '0.375em',
                '&::marker': {
                  color: 'hsl(var(--muted-foreground))',
                },
                '& > ul': {
                  marginTop: '0.75em',
                  marginBottom: '0.75em',
                },
              },
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.625em',
              li: {
                position: 'relative',
                paddingLeft: '0.375em',
                '&::marker': {
                  color: 'hsl(var(--muted-foreground))',
                },
                '& > ol': {
                  marginTop: '0.75em',
                  marginBottom: '0.75em',
                },
              },
            },
            table: {
              overflow: 'hidden',
              borderCollapse: 'collapse',
            },
            th: {
              padding: '0.75rem',
              backgroundColor: 'hsl(var(--muted) / 0.5)',
            },
            td: {
              padding: '0.75rem',
              borderColor: 'hsl(var(--border))',
            },
            tr: {
              borderBottomColor: 'hsl(var(--border))',
            },
          }
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 