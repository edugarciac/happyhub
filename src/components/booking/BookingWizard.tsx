import { BookingProvider, useBooking } from './BookingContext';
import Step1Calendar from './Step1Calendar';
import Step2Configuration from './Step2Configuration';
import Step3CustomerData from './Step3CustomerData';
import Step4Confirmation from './Step4Confirmation';
import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, title: 'Fecha y hora', description: 'Elige cuándo' },
  { number: 2, title: 'Configuración', description: 'Invitados y extras' },
  { number: 3, title: 'Tus datos', description: 'Enviar solicitud' },
  { number: 4, title: 'Confirmación', description: '¡Listo!' },
];

function StepIndicator() {
  const { state } = useBooking();

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = state.step > step.number;
          const isCurrent = state.step === step.number;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : step.number}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={`font-semibold text-sm ${
                      isCurrent ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-4 mb-8">
                  <div
                    className={`h-full rounded ${
                      state.step > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepContent() {
  const { state } = useBooking();

  switch (state.step) {
    case 1:
      return <Step1Calendar />;
    case 2:
      return <Step2Configuration />;
    case 3:
      return <Step3CustomerData />;
    case 4:
      return <Step4Confirmation />;
    default:
      return <Step1Calendar />;
  }
}

function BookingWizardContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-28 pb-8 px-4">
      <div className="container-custom max-w-6xl mx-auto">
        <StepIndicator />
        <StepContent />
      </div>
    </div>
  );
}

export default function BookingWizard() {
  return (
    <BookingProvider>
      <BookingWizardContent />
    </BookingProvider>
  );
}
