ALTER TABLE public.salon_queue_entries
  ADD COLUMN client_request_id VARCHAR(36);

CREATE UNIQUE INDEX uq_queue_salon_request
  ON public.salon_queue_entries (salon_id, client_request_id);
