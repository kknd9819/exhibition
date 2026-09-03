'use client';

export function EventSwitcher({ events, currentEventId, returnTo }: { events: Array<{ id: string; year: number; shortName: string }>; currentEventId?: string; returnTo: string }) {
  return <form className="event-switcher" action="/api/current-event" method="post">
    <label htmlFor="current-event-select" className="eyebrow">当前展会</label>
    <select id="current-event-select" name="eventId" defaultValue={currentEventId} onChange={(event) => event.currentTarget.form?.requestSubmit()} disabled={events.length < 2}>
      {events.map((item) => <option value={item.id} key={item.id}>{item.year} · {item.shortName}</option>)}
    </select>
    <input type="hidden" name="returnTo" value={returnTo}/>
    <small>{events.length > 1 ? '选择后自动切换工作台' : '当前仅有一个可访问展会'}</small>
  </form>;
}
