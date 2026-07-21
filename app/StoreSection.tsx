'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Navigation, MessageCircle } from 'lucide-react';

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

function getDirectionsUrl() {
  if (typeof navigator === 'undefined') return `https://maps.google.com/?daddr=${LAT},${LNG}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `maps://?daddr=${LAT},${LNG}`
    : `https://maps.google.com/?daddr=${LAT},${LNG}`;
}

function LeafletMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

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
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ height: '420px', minHeight: '300px' }}
    />
  );
}

export default function StoreSection() {
  const handleGetDirections = () => {
    window.open(getDirectionsUrl(), '_blank');
  };

  return (
    <section className="px-4 lg:px-10 py-16 lg:py-24">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold block mb-3">
            Notre Boutique
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
            Retrouvez-nous à{' '}
            <span className="text-gradient-gold">Yaoundé</span>
          </h2>
          <p className="text-sm text-foreground/60 max-w-xl">
            Venez vivre l'expérience Accessoires Exclusifs en personne — découvrez notre atelier olfactif, essayez nos créations et recevez un conseil personnalisé.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          <div className="lg:col-span-3">
            <LeafletMap />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono mb-1">Adresse</p>
                <p className="text-sm font-semibold text-foreground">{STORE_INFO.name}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{STORE_INFO.address}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono mb-2">Horaires</p>
                <div className="space-y-1.5">
                  {STORE_INFO.hours.map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-xs">
                      <span className="text-foreground/60">{day}</span>
                      <span className={`font-mono font-semibold ${time === 'Fermé' ? 'text-foreground/30' : 'text-foreground'}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono mb-1">Contact</p>
                <p className="text-sm font-semibold text-foreground">{STORE_INFO.phone}</p>
              </div>
            </div>

            <button
              onClick={handleGetDirections}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all"
            >
              <Navigation size={16} />
              Obtenir l'itinéraire
            </button>

            <a
              href={`https://wa.me/${STORE_INFO.whatsapp.replace(/\s+/g, '').replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 text-sm text-foreground/70 hover:text-foreground hover:border-white/20 transition-all"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              Contacter via WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
