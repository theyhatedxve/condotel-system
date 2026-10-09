import { Check } from 'lucide-react';

const steps = [
  { label: 'Select Room', description: 'Choose your preferred room' },
  { label: 'Guest Details', description: 'Review your information' },
  { label: 'Payment', description: 'Secure checkout' },
  { label: 'Confirmation', description: 'Review and complete' },
];

export default function BookingSteps({ activeStep }) {
  return (
    <ol className="booking-steps" aria-label="Booking progress">
      {steps.map(({ label, description }, index) => (
        <li
          key={label}
          className={
            index + 1 < activeStep
              ? 'is-complete'
              : index + 1 === activeStep
                ? 'is-active'
                : ''
          }
          aria-current={index + 1 === activeStep ? 'step' : undefined}
        >
          <span>
            {index + 1 < activeStep ? <Check size={15} /> : index + 1}
          </span>
          <div>
            <strong>{label}</strong>
            <small>{description}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
