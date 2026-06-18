import { useEffect, useMemo, useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import PublicFooter from '../../components/PublicFooter'

type CalendarEvent = { type: string; text: string }

const indonesiaCalendarEvents: Record<number, Record<string, CalendarEvent[]>> = {
  2026: {
    '2026-01-01': [{ type: 'libur', text: 'Tahun Baru 2026 Masehi' }],
    '2026-01-16': [{ type: 'libur', text: 'Isra Mikraj Nabi Muhammad SAW' }],
    '2026-02-16': [{ type: 'cuti', text: 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili' }],
    '2026-02-17': [{ type: 'libur', text: 'Tahun Baru Imlek 2577 Kongzili' }],
    '2026-03-18': [{ type: 'cuti', text: 'Cuti Bersama Hari Suci Nyepi Tahun Baru Saka 1948' }],
    '2026-03-19': [{ type: 'libur', text: 'Hari Suci Nyepi Tahun Baru Saka 1948' }],
    '2026-03-20': [{ type: 'cuti', text: 'Cuti Bersama Hari Raya Idul Fitri 1447 H' }],
    '2026-03-21': [{ type: 'libur', text: 'Hari Raya Idul Fitri 1447 H' }],
    '2026-03-22': [{ type: 'libur', text: 'Hari Raya Idul Fitri 1447 H' }],
    '2026-03-23': [{ type: 'cuti', text: 'Cuti Bersama Hari Raya Idul Fitri 1447 H' }],
    '2026-03-24': [{ type: 'cuti', text: 'Cuti Bersama Hari Raya Idul Fitri 1447 H' }],
    '2026-04-03': [{ type: 'libur', text: 'Wafat Yesus Kristus' }],
    '2026-04-05': [{ type: 'libur', text: 'Kebangkitan Yesus Kristus (Paskah)' }],
    '2026-05-01': [{ type: 'libur', text: 'Hari Buruh Internasional' }],
    '2026-05-14': [{ type: 'libur', text: 'Kenaikan Yesus Kristus' }],
    '2026-05-15': [{ type: 'cuti', text: 'Cuti Bersama Kenaikan Yesus Kristus' }],
    '2026-05-27': [{ type: 'libur', text: 'Hari Raya Idul Adha 1447 H' }],
    '2026-05-28': [{ type: 'cuti', text: 'Cuti Bersama Hari Raya Idul Adha 1447 H' }],
    '2026-05-31': [{ type: 'libur', text: 'Hari Raya Waisak 2570 BE' }],
    '2026-06-01': [{ type: 'libur', text: 'Hari Lahir Pancasila' }],
    '2026-06-16': [{ type: 'libur', text: 'Tahun Baru Islam 1448 H' }],
    '2026-08-17': [{ type: 'libur', text: 'Hari Proklamasi Kemerdekaan Republik Indonesia' }],
    '2026-08-25': [{ type: 'libur', text: 'Maulid Nabi Muhammad SAW' }],
    '2026-12-24': [{ type: 'cuti', text: 'Cuti Bersama Hari Raya Natal' }],
    '2026-12-25': [{ type: 'libur', text: 'Hari Raya Natal' }],
  },
}

function mergeEvents(...sources: Array<Record<string, CalendarEvent[]>>) {
  return sources.reduce<Record<string, CalendarEvent[]>>((acc, source) => {
    Object.entries(source).forEach(([date, items]) => {
      const existing = acc[date] || []
      const merged = [...existing]
      items.forEach(item => {
        if (!merged.some(event => event.text === item.text)) merged.push(item)
      })
      acc[date] = merged
    })
    return acc
  }, {})
}

export default function Kalender() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const baseEvents: Record<string, CalendarEvent[]> = useMemo(() => indonesiaCalendarEvents[currentYear] || {}, [currentYear])
  const [events, setEvents] = useState(baseEvents)

  useEffect(() => {
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/ID`)
      .then(response => response.ok ? response.json() : [])
      .then((holidays: Array<{ date: string; localName: string }>) => {
        const nationalEvents = holidays.reduce<Record<string, CalendarEvent[]>>((acc, holiday) => {
          acc[holiday.date] = [...(acc[holiday.date] || []), { type: 'libur', text: holiday.localName }]
          return acc
        }, {})
        setEvents(mergeEvents(nationalEvents, baseEvents))
      })
      .catch(() => setEvents(baseEvents))
  }, [currentYear, baseEvents])

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const prevMonth = () => {
    setCurrentMonth(m => {
      if (m !== 0) return m - 1
      setCurrentYear(y => y - 1)
      return 11
    })
  }
  const nextMonth = () => {
    setCurrentMonth(m => {
      if (m !== 11) return m + 1
      setCurrentYear(y => y + 1)
      return 0
    })
  }

  const sidebarEvents = Object.entries(events)
    .filter(([date]) => {
      const d = new Date(date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div>
      <PublicNavbar />
      <section style={{ background: 'var(--inst-navy)', color: 'white', padding: '3rem 0' }}>
        <div className="container">
          <h1 className="mb-2">Kalender</h1>
          <p className="mb-0 opacity-75">kalender yang menampilkan tanggal-tanggal penting dan hari libur nasional Indonesia.</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {/* Calendar */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  {/* Month Navigation */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <button className="btn btn-outline-secondary btn-sm" onClick={prevMonth}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <h5 className="mb-0">{monthNames[currentMonth]} {currentYear}</h5>
                    <button className="btn btn-outline-secondary btn-sm" onClick={nextMonth}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="calendar-grid">
                    {dayNames.map(d => (
                      <div className="calendar-header" key={d}>{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div className="calendar-day" key={`empty-${i}`} style={{ background: '#f8f9fa' }}></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`
                      const dayEvents = events[dateKey] || []
                      const isToday = dateKey === today.toISOString().slice(0, 10)
                      return (
                        <div className="calendar-day" key={day} style={isToday ? { outline: '2px solid var(--inst-accent)', outlineOffset: '-2px' } : undefined}>
                          <div className="day-number">{day + 1}</div>
                          {dayEvents.map((evt, ei) => (
                            <div className={`event ${evt.type}`} key={ei}>{evt.text}</div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="d-flex gap-3 mt-3 flex-wrap">
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      <span className="d-inline-block rounded" style={{ width: 12, height: 12, background: 'rgba(16,185,129,0.3)' }}></span> Libur
                    </span>
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      <span className="d-inline-block rounded" style={{ width: 12, height: 12, background: 'rgba(59,110,255,0.25)' }}></span> Cuti Bersama
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Sidebar */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h6 className="mb-0">Hari Penting {monthNames[currentMonth]}</h6>
                </div>
                <div className="card-body p-0">
                  {sidebarEvents.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <i className="bi bi-calendar-x fs-1 mb-2 d-block"></i>
                      Tidak ada tanggal penting
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {sidebarEvents.map(([date, evts]) => (
                        evts.map((evt, ei) => (
                          <div className="list-group-item d-flex gap-3 align-items-start" key={`${date}-${ei}`}>
                            <div className={`badge ${
                              evt.type === 'cuti' ? 'bg-primary' :
                              evt.type === 'ujian' ? 'bg-danger' :
                              evt.type === 'libur' ? 'bg-success' : 'bg-primary'
                            }`} style={{ minWidth: 70, fontSize: '0.7rem' }}>
                              {new Date(date).getDate()} {monthNames[currentMonth].substring(0, 3)}
                            </div>
                            <span className="small">{evt.text}</span>
                          </div>
                        ))
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
