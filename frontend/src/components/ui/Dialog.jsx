import React, { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const MotionDiv = React.forwardRef((props, ref) => <motion.div ref={ref} {...props} />);
MotionDiv.displayName = "MotionDiv";

const Dialog = ({ open, onOpenChange, children, ...props }) => {
  useEffect(() => {
    if (!open) {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      return;
    }
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
};
const DialogTrigger = DialogPrimitive.Trigger;

const DialogPopup = React.forwardRef(
  (
    {
      className = "",
      showCloseButton = true,
      from = "top",
      transition = null,
      position = "top",
      children,
      ...props
    },
    ref
  ) => {
    const defaultTransition = transition || {
      type: "spring",
      stiffness: 150,
      damping: 25,
    };

    const animationVariants = {
      top: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      },
      bottom: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
      },
      left: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      },
      right: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
      },
    };

    const variants = animationVariants[from];

    const isCentered = position === "center";
    const disableInternalScroll = String(className || "").includes("modal-no-scroll");
    const contentBaseClass = disableInternalScroll
      ? "relative w-[92vw] max-w-[600px] gap-4 !rounded-none border border-gray-200 bg-white p-6 shadow-lg dark:bg-slate-800 dark:border-slate-700"
      : "relative w-[92vw] max-w-[600px] gap-4 !rounded-none border border-gray-200 bg-white p-6 shadow-lg dark:bg-slate-800 dark:border-slate-700 overflow-y-auto max-h-[85vh] modal-scroll";

    return (
      <DialogPrimitive.Portal>
        <div className="dialog-portal-wrapper">
          <AnimatePresence mode="sync">
            <motion.div
              key="dialog-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md ${
                isCentered ? "" : "flex justify-center items-start pt-10"
              }`}
            />
            {isCentered ? (
              <DialogPrimitive.Content asChild {...props}>
                <div
                  ref={ref}
                  className="fixed top-1/2 left-1/2 z-[9999] m-0 p-0"
                  style={{ transform: "translate(-50%, -50%)" }}
                >
                  <MotionDiv
                    key="dialog-content-centered"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={defaultTransition}
                    className="w-[95vw] max-w-[450px]"
                  >
                    <div className={`${contentBaseClass} ${className}`}>
                      {children}
                      {showCloseButton && (
                        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full bg-white/10 backdrop-blur-md p-2 opacity-80 transition-all hover:opacity-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:pointer-events-none">
                          <X className="h-5 w-5" />
                          <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                      )}
                    </div>
                  </MotionDiv>
                </div>
              </DialogPrimitive.Content>
            ) : (
              <DialogPrimitive.Content asChild {...props}>
                <MotionDiv
                  key="dialog-content-top"
                  ref={ref}
                  initial={variants.initial}
                  animate={variants.animate}
                  exit={variants.exit}
                  transition={defaultTransition}
                  className={`fixed top-10 left-1/2 z-[9999] -translate-x-1/2 ${contentBaseClass} ${className}`}
                >
                  {children}
                  {showCloseButton && (
                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full bg-white/10 backdrop-blur-md p-2 opacity-80 transition-all hover:opacity-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:pointer-events-none">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                  )}
                </MotionDiv>
              </DialogPrimitive.Content>
            )}
          </AnimatePresence>
        </div>
      </DialogPrimitive.Portal>
    );
  }
);
DialogPopup.displayName = "DialogPopup";

const DialogClose = DialogPrimitive.Close;

const DialogHeader = ({ className = "", ...props }) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className = "", ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={`text-sm text-gray-500 dark:text-gray-400 ${className}`} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
