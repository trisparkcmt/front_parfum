"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Navigation, MessageCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shopService } from '@/services/apiService';
import type { CompanyInfo } from '@/types';
import { buildWhatsAppUrl, getCompanyWhatsAppNumber } from '@/lib/utils';

const LAT = 3.86484;
const LNG = 11.52030;

const STORE_INFO = {
  name: "Accessoires Exclusifs",
  addressFr: "Yaoundé, Centre, Cameroun",
  addressEn: "Yaounde, Centre, Cameroon",
};

function getDirectionsUrl() {
  return `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function LeafletMap() {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language?.startsWith("en");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (mapInstanceRef.current || !mapRef.current) return;

      const map = L.default.map(mapRef.current, {
        center: [LAT, LNG],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const redIcon = L.default.divIcon({
        className: "",
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #ef4444;
            border: 3px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6);
          "></div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      L.default.marker([LAT, LNG], { icon: redIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 2px; text-align:center;">
            <strong style="color:#C5A059">${STORE_INFO.name}</strong><br/>
            <small style="color:#666">${isEn ? STORE_INFO.addressEn : STORE_INFO.addressFr}</small>
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
  }, [isEn]);

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-black/[0.06] dark:border-[var(--t-card-border)] sm:h-[420px]">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white text-neutral-400 dark:bg-[var(--t-surface-raised)] dark:text-[var(--t-text-muted)]">
          <Loader2 size={18} className="animate-spin text-[var(--color-gold)]" />
          <span className="text-xs">
            {t('store_map_loading')}
          </span>
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
  const { i18n, t } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  const companyDayLabels: Record<string, { fr: string; en: string }> = {
    Lundi: { fr: 'Lundi', en: 'Monday' },
    Mardi: { fr: 'Mardi', en: 'Tuesday' },
    Mercredi: { fr: 'Mercredi', en: 'Wednesday' },
    Jeudi: { fr: 'Jeudi', en: 'Thursday' },
    Vendredi: { fr: 'Vendredi', en: 'Friday' },
    Samedi: { fr: 'Samedi', en: 'Saturday' },
    Dimanche: { fr: 'Dimanche', en: 'Sunday' },
  };

  const storeDetails = {
    name: companyInfo?.nom || STORE_INFO.name,
    address: companyInfo?.localisation || (isEn ? STORE_INFO.addressEn : STORE_INFO.addressFr),
    phone: companyInfo?.telephone_principal || '',
    whatsapp: getCompanyWhatsAppNumber(companyInfo),
  };

  useEffect(() => {
    let active = true;

    shopService.getCompanyInfos()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setCompanyInfo(data[0]);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const groupedStoreHours = (() => {
    const days = companyInfo?.jours_ouverture || [
      { jour: 'Lundi', ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' },
      { jour: 'Mardi', ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' },
      { jour: 'Mercredi', ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' },
      { jour: 'Jeudi', ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' },
      { jour: 'Vendredi', ouvert: true, heure_ouverture: '09:00', heure_fermeture: '19:00' },
      { jour: 'Samedi', ouvert: true, heure_ouverture: '10:00', heure_fermeture: '18:00' },
      { jour: 'Dimanche', ouvert: false, heure_ouverture: null, heure_fermeture: null },
    ];

    const formatRange = (labels: string[]) => {
      if (!labels.length) return '';
      if (labels.length === 1) return labels[0];
      return `${labels[0]} - ${labels[labels.length - 1]}`;
    };

    const groups: Array<{ day: string; time: string }> = [];
    let current: { labels: string[]; time: string; endIndex: number } | null = null;

    const pushCurrent = () => {
      if (!current) return;
      groups.push({
        day: formatRange(current.labels),
        time: current.time,
      });
      current = null;
    };

    days.forEach((day, index) => {
      const label = isEn ? companyDayLabels[day.jour]?.en || day.jour : day.jour;
      const time = day.ouvert ? `${day.heure_ouverture} – ${day.heure_fermeture}` : (isEn ? 'Closed' : 'Fermé');

      if (!current) {
        current = { labels: [label], time, endIndex: index };
        return;
      }

      const sameSchedule = current.time === time && index === current.endIndex + 1;
      if (sameSchedule) {
        current.labels.push(label);
        current.endIndex = index;
        return;
      }

      pushCurrent();
      current = { labels: [label], time, endIndex: index };
    });

    pushCurrent();
    return groups;
  })();

  const storeHours = groupedStoreHours;

  const handleGetDirections = () => {
    window.open(getDirectionsUrl(), "_blank", "noopener,noreferrer");
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
            {t('store_our_shop')}
          </span>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
            {t('store_find_us_in')} {" "}
            <span className="text-gradient-gold">{t('store_yaounde')}</span>
          </h2>
          <p className="max-w-xl text-sm text-[var(--t-text-muted)]">
            {t('store_description')}
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
            <InfoCard icon={<MapPin size={16} />} label={t('store_address')}>
              <p className="text-sm font-semibold text-[var(--foreground)]">{storeDetails.name}</p>
              <p className="mt-0.5 text-xs text-[var(--t-text-muted)]">
                {storeDetails.address}
              </p>
            </InfoCard>

            <InfoCard icon={<Clock size={16} />} label={t('store_hours')}>
              <div className="space-y-1.5">
                {storeHours.map(({ day, time }) => (
                  <div key={day} className="flex justify-between gap-3 text-xs">
                    <span className="text-[var(--t-text-muted)]">{day}</span>
                    <span className={cx(
                      "font-mono font-semibold",
                      time === "Closed" || time === "Fermé" ? "text-[var(--t-text-muted)]/60" : "text-[var(--foreground)]"
                    )}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </InfoCard>

            <InfoCard icon={<Phone size={16} />} label={t('store_contact')}>
              <p className="text-sm font-semibold text-[var(--foreground)]">{storeDetails.phone}</p>
            </InfoCard>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-1">
              <button
                onClick={handleGetDirections}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-gold)] py-3.5 text-sm font-bold text-black transition-all hover:bg-[var(--color-gold)]/90 active:scale-[0.98]"
              >
                <Navigation size={16} />
                {t('store_get_directions')}
              </button>

              <a
                href={buildWhatsAppUrl(storeDetails.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] py-3.5 text-sm text-neutral-500 transition-all hover:border-black/20 hover:text-[var(--foreground)] dark:border-[var(--t-card-border)] dark:text-[var(--t-text-muted)] dark:hover:border-[var(--t-card-hover-border)]"
              >
                <MessageCircle size={16} className="text-emerald-500" />
                {t('store_whatsapp')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}