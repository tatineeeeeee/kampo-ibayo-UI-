"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircleHeart,
  ArrowRight,
} from "lucide-react";
import ReviewSystem from "../ReviewSystem";

const ReviewsSection = () => {
  return (
    <section
      id="reviews"
      className="bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            What Our Guests Say
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ReviewSystem limit={8} showPagination={false} className="" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center mt-10"
        >
          <Link
            href="/review"
            className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl touch-manipulation"
          >
            <MessageCircleHeart className="w-5 h-5 mr-2" />
            Share Your Experience
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
