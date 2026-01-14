"use client";
import { cn } from "@/shared/lib/utils";
import React from "react";
import { motion, useAnimate, HTMLMotionProps } from "framer-motion";

interface StatefulButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  className?: string;
  children: React.ReactNode;
  action?: () => Promise<unknown>;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
}

export const StatefulButton = ({ className, children, action, variant = "primary", ...props }: StatefulButtonProps) => {
  const [scope, animate] = useAnimate();
  const { onClick, ...buttonProps } = props;

  const animateLoading = async () => {
    await animate(
      ".loader",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );
  };

  const animateSuccess = async () => {
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".check",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );

    await animate(
      ".check",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 2,
        duration: 0.2,
      },
    );
  };

  const animateError = async () => {
    await animate(
      ".loader",
      { width: "0px", scale: 0, display: "none" },
      { duration: 0.2 }
    );
    // Optional: Shake animation or error icon? For now just reset.
  }

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;

    if (onClick) {
      onClick(event);
    }

    if (action) {
      try {
        await animateLoading();
        const result = await action();
        // Check if result implies success or failure if needed, but usually action throws or returns false if failed.
        // Assumption: action returns truthy {success: true} or void for success.
        if (result && typeof result === 'object' && result !== null && 'success' in result && !(result as { success: boolean }).success) {
          await animateError();
        } else {
          await animateSuccess();
        }
      } catch (error) {
        console.error(error);
        await animateError();
      }
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "danger": return "bg-red-500 hover:ring-red-500";
      case "secondary": return "bg-gray-500 hover:ring-gray-500";
      case "outline": return "bg-transparent border border-gray-300 text-gray-700 hover:ring-gray-300";
      case "ghost": return "bg-transparent text-gray-700 hover:bg-gray-100 ring-0 hover:ring-0";
      default: return "bg-green-500 hover:ring-green-500"; // Primary default
    }
  };

  const variantClass = getVariantClasses();

  return (
    <motion.button
      layout
      layoutId="button"
      ref={scope}
      className={cn(
        "flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 font-medium text-white ring-offset-2 transition duration-200 hover:ring-2 dark:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 disabled:hover:ring-0",
        variantClass,
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};

const Loader = () => {
  return (
    <motion.svg
      animate={{
        rotate: [0, 360],
      }}
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        ease: "linear",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="loader text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </motion.svg>
  );
};
