"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Star, StarHalf } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

import { Button } from "@/components/ui/Button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  stars: number;
}

interface Gallery6Props {
  heading?: string;
  demoUrl?: string;
  items?: GalleryItem[];
}

const Gallery6 = ({
  heading = "Gallery",
  demoUrl = "https://www.shadcnblocks.com",
  items = [
    {
      id: "item-1",
      title: "Haute Parfumerie",
      summary: "Découvrez l'art de la création olfactive avec nos essences les plus rares.",
      url: "/shop/perfumes",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop",
      stars: 4,
    },
    {
      id: "item-2",
      title: "Accessoires de Luxe",
      summary: "Une sélection rigoureuse de montres et bijoux pour sublimer votre style.",
      url: "/shop/accessories",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      stars: 4.2,
    },
    {
      id: "item-3",
      title: "L'Atelier Numba",
      summary: "Composez votre signature olfactive unique dans notre atelier interactif.",
      url: "/numba/atelier",
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop",
      stars: 4.7,
    },
    {
      id: "item-5",
      title: "Élégance Intemporelle",
      summary: "Le raffinement absolu, de la fragrance à l'accessoire.",
      url: "/",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop",
      stars: 5,
    },
    {
      id: "item-6",
      title: "Haute Parfumerie",
      summary: "Découvrez l'art de la création olfactive avec nos essences les plus rares.",
      url: "/shop/perfumes",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop",
      stars: 4.3,
    },
    {
      id: "item-8",
      title: "Haute Parfumerie",
      summary: "Découvrez l'art de la création olfactive avec nos essences les plus rares.",
      url: "/shop/perfumes",
      image: "/parfume1.png",
      stars: 4.5,
    },
  ],
}: Gallery6Props) => {
  const [mounted, setMounted] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!carouselApi || !mounted) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const starValue = i + 1;
      if (starValue <= rating) {
        return <Star key={i} size={16} className="fill-gold text-gold" />;
      }
      if (starValue - 0.5 <= rating) {
        return <StarHalf key={i} size={16} className="fill-gold text-gold" />;
      }
      return <Star key={i} size={16} className="text-foreground/20" />;
    });
  };

  if (!mounted) return null;

  return (
    <section className="py-10">
      <div className="container">

        <div className=" flex justify-start items-center md:col-span-3 md:pl-4">
          <h2 className="mb-3 uppercase text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
            {heading}
          </h2>
        </div>

      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          plugins={[plugin.current]}
          opts={{
            loop: true,
            align: "start",
            breakpoints: {
              "(max-width: 768px)": {
                dragFree: true,
              },
            },
          }}
          className="relative"
        >
          <CarouselContent className="ml-0 h-64 md:h-96">
            {items.map((item) => (
              <CarouselItem key={item.id} className="pl-1 basis-52 md:basis-[400px] h-64 md:h-96">
                <a
                  href={item.url}
                  className="group flex flex-col justify-between items-center"
                >
                  <div>
                    <div className="flex aspect-[3/2] overflow-clip w-full rounded-none">
                      <div className="flex-1">
                        <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 line-clamp-3 break-words pt-4 text-sm font-medium md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-2xl">
                    {item.title}
                    <div className="flex justify-center items-center gap-0.5 mt-1">
                      {renderStars(item.stars)}
                    </div>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export { Gallery6 };
