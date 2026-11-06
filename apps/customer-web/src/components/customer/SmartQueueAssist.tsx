import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { Salon, QueueEntry } from '@kumbhakaran/shared-types';
import { useCustomer } from '../../context/CustomerContext';

interface SmartQueueAssistProps {
  salon: Salon;
  ticket: QueueEntry;
  checkInToken?: string | null;
}

export const SmartQueueAssist: React.FC<SmartQueueAssistProps> = ({ salon, ticket, checkInToken }) => {
  const {
    confirmQueueArrival,
    setQueueLocationConsent,
    observeQueueLocation,
    respondToQueueDeparture,
    triggerNotification,
  } = useCustomer();
  const [isWorking, setIsWorking] = useState(false);
  const [nearSalon, setNearSalon] = useState(false);
  const [hasDeparturePrompt, setHasDeparturePrompt] = useState(Boolean(ticket.departureDetectedAt));
  const [message, setMessage] = useState('');
  const observeInFlight = useRef(false);
  const isActiveTicket = ['waiting', 'called', 'skipped'].includes(ticket.status);

  useEffect(() => {
    setHasDeparturePrompt(Boolean(ticket.departureDetectedAt));
  }, [ticket.departureDetectedAt]);

  useEffect(() => {
    if (!ticket.locationConsent || !isActiveTicket) return;
    let active = true;
    const observe = async () => {
      if (!active || document.visibilityState !== 'visible' || observeInFlight.current) return;
      observeInFlight.current = true;
      try {
        const result = await observeQueueLocation(salon.id, ticket.id);
        if (!active) return;
        setNearSalon(Boolean(result.nearSalon));
        if (result.requiresQrCheckIn) {
          setMessage('You’re near the salon. Scan the counter QR to confirm you’ve arrived.');
        }
        if (result.requiresCustomerConfirmation) {
          setHasDeparturePrompt(true);
          setMessage('');
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Location check could not be completed.');
        }
      } finally {
        observeInFlight.current = false;
      }
    };
    void observe();
    const intervalId = window.setInterval(() => void observe(), 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void observe();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ticket.id, ticket.locationConsent, ticket.status, salon.id, isActiveTicket]);

  if (!isActiveTicket) return null;

  const enableLocation = async () => {
    setIsWorking(true);
    setMessage('');
    try {
      await setQueueLocationConsent(salon.id, ticket.id, true);
      const result = await observeQueueLocation(salon.id, ticket.id);
      setNearSalon(Boolean(result.nearSalon));
      if (result.requiresQrCheckIn) {
        setMessage('You’re near the salon. Scan the counter QR to confirm you’ve arrived.');
      } else if (result.reason === 'location_accuracy_too_low') {
        setMessage('Your location needs a clearer signal. You can try again or update your status manually.');
      } else {
        setMessage('Location assistance is on while this page is open. It will never automatically remove your ticket.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not enable location assistance.');
    } finally {
      setIsWorking(false);
    }
  };

  const disableLocation = async () => {
    setIsWorking(true);
    try {
      await setQueueLocationConsent(salon.id, ticket.id, false);
      setNearSalon(false);
      setMessage('Location assistance is off. Your queue ticket is unchanged.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not turn off location assistance.');
    } finally {
      setIsWorking(false);
    }
  };

  const confirmArrival = async () => {
    if (!checkInToken) return;
    setIsWorking(true);
    try {
      await confirmQueueArrival(salon.id, ticket.id, checkInToken);
      setMessage('Your arrival is confirmed. Location will not mark your service complete.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not confirm your arrival.');
    } finally {
      setIsWorking(false);
    }
  };

  const answerDeparture = async (response: 'left' | 'still_here' | 'returning') => {
    setIsWorking(true);
    try {
      await respondToQueueDeparture(salon.id, ticket.id, response);
      setHasDeparturePrompt(false);
      triggerNotification(response === 'left' ? 'Your ticket was cancelled as requested.' : 'Your place in the queue is unchanged.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your queue status.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#FF6422]">
          {ticket.arrivalConfirmedAt ? <ShieldCheck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-stone-900">
            {ticket.arrivalConfirmedAt ? 'You’re checked in' : 'Your spot is reserved'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            {ticket.arrivalConfirmedAt
              ? 'You can opt in to location assistance while this page is open. We’ll ask before changing your queue status.'
              : 'When you arrive, scan the salon QR to confirm your check-in. Optional location assistance can help you know when you’re nearby.'}
          </p>
        </div>
      </div>

      {checkInToken && !ticket.arrivalConfirmedAt && (
        <button
          type="button"
          disabled={isWorking}
          onClick={confirmArrival}
          className="mt-3 w-full rounded-xl bg-[#1F1F1F] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          Confirm check-in at {salon.name}
        </button>
      )}

      {ticket.locationConsent ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Location assistance is on while this page is open
          </span>
          <button type="button" disabled={isWorking} onClick={disableLocation} className="ml-auto text-[11px] font-bold text-stone-600 underline disabled:opacity-50">
            Turn off
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isWorking}
          onClick={enableLocation}
          className="mt-3 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-800 disabled:opacity-50"
        >
          {isWorking ? 'Checking…' : 'Enable location assistance'}
        </button>
      )}

      {nearSalon && !ticket.arrivalConfirmedAt && !checkInToken && (
        <p className="mt-2 text-xs font-semibold text-emerald-700">
          You appear to be near the salon. Please scan its QR code—GPS alone does not confirm arrival.
        </p>
      )}

      {message && <p className="mt-2 text-xs text-stone-600">{message}</p>}

      {hasDeparturePrompt && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-extrabold text-amber-950">Looks like you may have left the salon.</p>
              <p className="mt-1 text-[11px] text-amber-900">Your ticket stays active unless you confirm that you’re leaving.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" disabled={isWorking} onClick={() => void answerDeparture('left')} className="rounded-lg bg-amber-700 px-2 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              Yes, I’ve left
            </button>
            <button type="button" disabled={isWorking} onClick={() => void answerDeparture('still_here')} className="rounded-lg border border-amber-300 bg-white px-2 py-2 text-[11px] font-bold text-amber-950 disabled:opacity-50">
              I’m still here
            </button>
            <button type="button" disabled={isWorking} onClick={() => void answerDeparture('returning')} className="rounded-lg border border-amber-300 bg-white px-2 py-2 text-[11px] font-bold text-amber-950 disabled:opacity-50">
              I’ll be back shortly
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-stone-500">
        Location is optional. SLOON stores observation accuracy and time, not your coordinates or movement history. You can turn it off at any time.
      </p>
    </section>
  );
};
