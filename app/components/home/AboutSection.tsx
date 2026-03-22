"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Leaf,
  Mountain,
  Star,
  Shield,
  Users,
  Award,
} from "lucide-react";
import { INCLUDED_GUESTS } from "../../lib/constants/pricing";

interface AboutSectionProps {
  liveRating: number | null;
  ratingCount: number;
  ratingLoading: boolean;
}

const featureCards = [
  {
    icon: <Leaf className="w-4 h-4 xs:w-5 xs:h-5 text-green-400" />,
    bg: "bg-green-500/20",
    border: "hover:border-green-500/50",
    title: "Eco-Friendly",
    sub: "Sustainable practices",
  },
  {
    icon: <Mountain className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />,
    bg: "bg-primary/20",
    border: "hover:border-primary/50",
    title: "Scenic Views",
    sub: "Nature's panorama",
  },
  {
    icon: <Users className="w-4 h-4 xs:w-5 xs:h-5 text-orange-400" />,
    bg: "bg-orange-500/20",
    border: "hover:border-orange-500/50",
    title: "Family-Friendly",
    sub: "Perfect for all ages",
  },
  {
    icon: <Award className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400" />,
    bg: "bg-yellow-500/20",
    border: "hover:border-yellow-500/50",
    title: "Premium Quality",
    sub: "Exceptional service",
  },
];

const AboutSection = ({
  liveRating,
  ratingCount,
  ratingLoading,
}: AboutSectionProps) => {
  return (
    <section
      id="about"
      className="bg-card text-foreground py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
            About <span className="text-primary">Kampo Ibayo</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Where comfort meets adventure in the heart of Cavite&apos;s
            natural beauty
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-2 lg:order-1"
          >
            <div className="relative overflow-hidden rounded-xl shadow-2xl">
              <Image
                src="/pool.jpg"
                alt="Resort Pool and Nature View"
                width={600}
                height={400}
                className="w-full h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Safe &amp; Secure
              </div>

              {ratingLoading ? (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="w-16 h-4 bg-gray-300 rounded animate-pulse inline-block"></span>
                </div>
              ) : liveRating !== null && ratingCount > 0 ? (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{liveRating} Guest Rating</span>
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div className="space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Located in the peaceful farmlands of Barangay Tapia, General
                Trias, Cavite,
                <span className="text-foreground font-medium">
                  {" "}Kampo Ibayo
                </span>{" "}
                is a family-friendly camping resort that accommodates up to
                {INCLUDED_GUESTS} guests in modern comfort.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Featuring two air-conditioned poolside family rooms, a
                refreshing swimming pool, and complete amenities including a
                fully-equipped kitchen, videoke, and adventure hanging bridge,
                we offer the perfect blend of{" "}
                <span className="text-primary font-medium">
                  relaxation and adventure
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4 pt-4">
              {featureCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className={`flex flex-col xs:flex-row items-center xs:items-start gap-2 xs:gap-3 p-2 xs:p-3 bg-muted/50 rounded-lg border border-border ${card.border} transition-colors text-center xs:text-left`}
                >
                  <div className={`w-8 h-8 xs:w-10 xs:h-10 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-foreground font-medium text-xs xs:text-sm sm:text-base">
                      {card.title}
                    </h4>
                    <p className="text-muted-foreground text-[10px] xs:text-xs sm:text-sm hidden xs:block">
                      {card.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
