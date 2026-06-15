import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail, MessageCircle, MapPin, Phone } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="pt-20 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Get In{" "}
            <span className="bg-gradient-to-r from-[#D4A843] to-[#E5C05A] bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#A0A0B0]">
            Our team is available 24/7 to help you with any questions
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              { icon: Mail, title: "Email", value: "support@primestone.com" },
              { icon: MessageCircle, title: "Live Chat", value: "Available 24/7" },
              { icon: Phone, title: "Phone", value: "+1 (555) 123-4567" },
              { icon: MapPin, title: "Office", value: "Global Operations" },
            ].map((item) => (
              <Card key={item.title} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center shrink-0">
                  <item.icon size={22} className="text-[#D4A843]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F5F5F5]">{item.title}</div>
                  <div className="text-sm text-[#A0A0B0]">{item.value}</div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8">
            <h3 className="text-xl font-semibold text-[#F5F5F5] mb-6">Send us a message</h3>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50"
                />
              </div>
              <select className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#A0A0B0] text-sm focus:outline-none focus:border-[#D4A843]/50">
                <option>Select a subject</option>
                <option>Account Opening</option>
                <option>Deposit / Withdrawal</option>
                <option>Technical Support</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
              <textarea
                rows={4}
                placeholder="Your Message"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0B0F] border border-white/10 text-[#F5F5F5] text-sm placeholder:text-[#A0A0B0] focus:outline-none focus:border-[#D4A843]/50 resize-none"
              />
              <Button variant="primary" className="w-full">Send Message</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
