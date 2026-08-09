'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Navigation, MessageCircle, Loader2 } from 'lucide-react';

const LAT = 3.86484;
const LNG = 11.52030;

const STORE_INFO = {
  name: 'Accessoires Exclusifs',
  address: 'Yaoundé, Centre, Cameroun',
  phone: '+237 680 254 243',
  whatsapp: '+237 680 254 243',
  hours: [
    { day: 'Lundi – Vendredi', time: '09h00 – 19h00' },
    { day: 'Samedi', time: '10h00 – 18h00' },
    { day: 'Dimanche', time: 'Fermé' },
  ],
};

// Apple Maps doesn't offer turn-by-turn directions in Cameroon, so every
// platform (iOS included) is routed to Google Maps' universal directions link.
function getDirectionsUrl() {
  return `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function LeafletMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (mapInstanceRef.current || !mapRef.current) return;

      const map = L.default.map(mapRef.current, {
        center: [LAT, LNG],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const goldIcon = L.default.divIcon({
        className: '',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #C5A059;
            border: 3px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 20px rgba(197,160,89,0.6);
          "></div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      L.default.marker([LAT, LNG], { icon: goldIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 2px; text-align:center;">
            <strong style="color:#C5A059">Accessoires Exclusifs</strong><br/>
            <small style="color:#666">Yaoundé, Cameroun</small>
          </div>
        `)
        .openPopup();

      map.whenReady(() => setIsReady(true));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-black/[0.06] dark:border-[var(--t-card-border)] sm:h-[420px]">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white text-neutral-400 dark:bg-[var(--t-surface-raised)] dark:text-[var(--t-text-muted)]">
          <Loader2 size={18} className="animate-spin text-[var(--color-gold)]" />
          <span className="text-xs">Chargement de la carte…</span>
        </div>
      )}
      <div ref={mapRef} className="relative z-0 h-full w-full" />
    </div>
  );
}

function InfoCard({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-black/[0.08] bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
        <div className="text-[var(--color-gold)]">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-[var(--t-text-muted)]">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function StoreSection() {
  const handleGetDirections = () => {
    window.open(getDirectionsUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="px-4 py-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-8 lg:mb-10"
        >
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Notre Boutique
          </span>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
            Retrouvez-nous à{' '}
            <span className="text-gradient-gold">Yaoundé</span>
          </h2>
          <p className="max-w-xl text-sm text-[var(--t-text-muted)]">
            Venez vivre l'expérience Accessoires Exclusifs en personne — découvrez notre atelier olfactif, essayez nos créations et recevez un conseil personnalisé.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        >
          <div className="lg:col-span-3">
            <LeafletMap />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <InfoCard icon={<MapPin size={16} />} label="Adresse">
              <p className="text-sm font-semibold text-[var(--foreground)]">{STORE_INFO.name}</p>
              <p className="mt-0.5 text-xs text-[var(--t-text-muted)]">{STORE_INFO.address}</p>
            </InfoCard>

            <InfoCard icon={<Clock size={16} />} label="Horaires">
              <div className=" space-y-1.5">
                {STORE_INFO.hours.map(({ day, time }) => (
                  <div key={day} className="flex justify-between gap-3 text-xs">
                    <span className="text-[var(--t-text-muted)]">{day}</span>
                    <span className={cx(
                      'font-mono font-semibold',
                      time === 'Fermé' ? 'text-[var(--t-text-muted)]/60' : 'text-[var(--foreground)]'
                    )}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </InfoCard>

            <InfoCard icon={<Phone size={16} />} label="Contact">
              <p className="text-sm font-semibold text-[var(--foreground)]">{STORE_INFO.phone}</p>
            </InfoCard>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-1">
              <button
                onClick={handleGetDirections}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-gold)] py-3.5 text-sm font-bold text-black transition-all hover:bg-[var(--color-gold)]/90 active:scale-[0.98]"
              >
                <Navigation size={16} />
                Obtenir l'itinéraire
              </button>

              <a
                href={`https://wa.me/${STORE_INFO.whatsapp.replace(/\s+/g, '').replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] py-3.5 text-sm text-neutral-500 transition-all hover:border-black/20 hover:text-[var(--foreground)] dark:border-[var(--t-card-border)] dark:text-[var(--t-text-muted)] dark:hover:border-[var(--t-card-hover-border)]"
              >
                <MessageCircle size={16} className="text-emerald-500" />
                Contacter via WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}