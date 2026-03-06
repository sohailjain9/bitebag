import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";

const faqs = [
  {
    q: "What is a surprise bag?",
    a: "A surprise bag contains unsold food from restaurants at the end of the day. You get great food at up to 70% off. The contents are a surprise — that's part of the fun!",
  },
  {
    q: "How do I collect my order?",
    a: "For pickup orders go to the restaurant during the collection window shown in your order confirmation. Show the confirmation screen to staff.",
  },
  {
    q: "What if I'm not happy with my bag?",
    a: "BiteBag bags are surprise bags so contents vary daily. If there's a genuine quality issue contact us and we'll make it right.",
  },
  {
    q: "How do I get a refund?",
    a: "Refunds are available for cancelled orders before the collection window opens. Contact us via WhatsApp below.",
  },
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <MobileLayout showNav={false}>
      <div className="px-5 pt-4 animate-slide-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-xl text-foreground">Help & Support</h1>
        </div>

        <h2 className="font-heading font-bold text-base text-foreground mb-4">Frequently Asked Questions</h2>

        <div className="space-y-2 mb-8">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-secondary rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground pr-2">{faq.q}</span>
                {openIndex === i ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 animate-fade-scale-in">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <h2 className="font-heading font-bold text-base text-foreground mb-4">Contact Us</h2>

        <div className="space-y-3">
          <a
            href="https://wa.me/919167088949"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 bg-primary text-primary-foreground rounded-xl p-4 font-semibold text-sm"
          >
            <MessageCircle size={20} />
            Chat with us on WhatsApp 💬
          </a>
          <a
            href="mailto:sohailjain9@gmail.com"
            className="w-full flex items-center gap-3 bg-secondary text-foreground rounded-xl p-4 font-semibold text-sm"
          >
            <Mail size={20} />
            Email us 📧
          </a>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HelpSupport;
