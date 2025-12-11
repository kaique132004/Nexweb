import { useState, useRef, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventInput,
  DateSelectArg,
  EventClickArg,
} from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { authFetch } from "../api/apiAuth";
import { API_ENDPOINTS } from "../api/endpoint";

// Mesmo tipo de Movement que você já usa no resto do projeto
type Movement = {
  id: number;
  username: string;
  supply_name: string;
  supply_id: number;
  quantity_amended: number;
  quantity_before: number;
  quantity_after: number;
  created: string;
  region_id: number;
  region_code: string;
  price_unit: number;
  total_price: number;
  type_entry: "IN" | "OUT";
  obs_alter: string | null;
};

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;       // 'Danger' | 'Success' | 'Primary' | 'Warning'
    movement?: Movement;    // se for evento gerado a partir de Movement
  };
}

const calendarsEvents = {
  Danger: "danger",
  Success: "success",
  Primary: "primary",
  Warning: "warning",
} as const;

const Calendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [transaction, setTransaction] = useState<Movement[]>([])
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState<
    keyof typeof calendarsEvents | ""
  >("");
  const [events, setEvents] = useState<CalendarEvent[]>([]); // eventos manuais
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const fetchData = async () => {
      const data = await authFetch<Movement[]>(`${API_ENDPOINTS.transaction}/list`)

      if(!data){
        console.error(data)
      } else{
        setTransaction(data)
      }
    }
    fetchData()
  }, [])

  // 1) Eventos gerados a partir dos movimentos
  const movementEvents: CalendarEvent[] = useMemo(
    () =>
      transaction.map((m) => {
        // Todos OUT = carregamento nos totens (como você disse)
        // IN no futuro virá do SMTP (chegada de suprimentos)
        const isIn = m.type_entry === "IN";

        let kindLabel: string;
        let calendarColor: keyof typeof calendarsEvents;

        if (isIn) {
          // futuro: entregas/chegadas via SMTP
          kindLabel = "Chegada Suprimentos";
          calendarColor = "Success"; // verde
        } else {
          // OUT = carregamento totem
          kindLabel = "Carregamento Totem";
          calendarColor = "Danger"; // vermelho (ou Primary se preferir)
        }

        const dateStr = m.created; // ISO completo, o FullCalendar lida bem

        return {
          id: `movement-${m.id}`,
          title: `${kindLabel} - ${m.supply_name} (${m.quantity_amended}) - ${m.region_code}`,
          start: dateStr,
          allDay: true,
          extendedProps: {
            calendar: calendarColor,
            movement: m,
          },
        };
      }),
    [transaction]
  );

  // 2) Soma dos eventos da API com os eventos manuais
  const allEvents = useMemo(
    () => [...movementEvents, ...events],
    [movementEvents, events]
  );

  // 3) Exemplos de eventos manuais iniciais (opcional)
  useEffect(() => {
    setEvents([
      {
        id: "local-1",
        title: "Reunião interna",
        start: new Date().toISOString().split("T")[0],
        allDay: true,
        extendedProps: { calendar: "Primary" },
      },
    ]);
  }, []);

  // Quando o usuário seleciona um range no calendário (para criar evento manual)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  // Clique em evento
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event as any;
    const isMovementEvent = String(event.id).startsWith("movement-");

    if (isMovementEvent) {
      // Evento vindo de Movement (só leitura, por enquanto)
      const m: Movement | undefined = event.extendedProps.movement;
      console.log("Movimento clicado:", m);

      // Se quiser abrir um modal de detalhes de consumo, poderia fazer aqui:
      // openMovementDetailsModal(m);

      return;
    }

    // Evento manual: permite edição via modal
    setSelectedEvent(event as CalendarEvent);
    setEventTitle(event.title || "");
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(
      (event.extendedProps.calendar as keyof typeof calendarsEvents) || "Primary"
    );
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      // Atualiza evento manual existente
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
              ...event,
              title: eventTitle,
              start: eventStartDate,
              end: eventEndDate,
              extendedProps: {
                ...(event.extendedProps || {}),
                calendar: eventLevel || "Primary",
              },
            }
            : event
        )
      );
    } else {
      // Cria novo evento manual
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: {
          calendar: eventLevel || "Primary",
        },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }

    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta
        title="Calendar | Nexventory "
        description="Nexventory Application"
      />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={allEvents}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
          />
        </div>

        {/* Modal para criar / editar eventos MANUAIS (não movimentos da API) */}
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl  lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div>

            <div className="mt-8">
              {/* Título */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-[#1e1e1e] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Cores / Nível do evento manual */}
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() =>
                                setEventLevel(
                                  key as keyof typeof calendarsEvents
                                )
                              }
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${eventLevel === key ? "block" : "hidden"
                                  }`}
                              />
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-[#1e1e1e] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-[#1e1e1e] h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-[#1e1e1e] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                <button
                  onClick={closeModal}
                  type="button"
                  className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg:white/[0.03] sm:w-auto"
                >
                  Close
                </button>
                <button
                  onClick={handleAddOrUpdateEvent}
                  type="button"
                  className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                  {selectedEvent ? "Update Changes" : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const calendarName = eventInfo.event.extendedProps.calendar || "Primary";
  const colorClass = `fc-bg-${String(calendarName).toLowerCase()}`;

  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot" />
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
