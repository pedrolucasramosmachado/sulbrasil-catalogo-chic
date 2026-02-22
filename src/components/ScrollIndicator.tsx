import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export const ScrollIndicator = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      // Hide when near bottom (within 100px)
      setVisible(scrollTop + winHeight < docHeight - 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="block sm:hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce transition-opacity">
      <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-glow">
        <ChevronDown className="w-6 h-6" />
      </div>
    </div>
  );
};
