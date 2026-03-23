import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from "lucide-react";
// Logo from uploaded file

export const Footer = () => {
  return (
    <footer className="bg-surface border-t border-card-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo-sulbrasil.png" 
                alt="Sulbrasil" 
                className="h-8 w-auto"
              />
              <h3 className="text-lg font-bold text-primary">Sulbrasil</h3>
            </div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Fábrica oficial de moda feminina com qualidade premium e 
              estilo moderno. Sua elegância é nossa inspiração.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Navegação</h4>
            <div className="space-y-2">
              {[
                "Início",
                "Blusas e Camisetas", 
                "Vestidos",
                "Calças",
                "Shorts",
                "Conjuntos",
                "Listradas e Estonadas"
              ].map((link) => (
                <Button
                  key={link}
                  variant="ghost" 
                  className="h-auto p-0 text-sm text-foreground-muted hover:text-foreground justify-start"
                >
                  {link}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Phone className="w-4 h-4 text-primary" />
                <div>
                  <p>(11) 99999-9999</p>
                  <p>(11) 3333-3333</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Mail className="w-4 h-4 text-primary" />
                <p>contato@sulbrasil.com.br</p>
              </div>
              <div className="flex items-start gap-3 text-sm text-foreground-muted">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p>Rua das Flores, 123</p>
                  <p>Centro - São Paulo, SP</p>
                  <p>CEP: 01234-567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Horário de Atendimento</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-foreground-muted">
                <Clock className="w-4 h-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p><strong>Segunda a Sexta:</strong></p>
                  <p>8h às 18h</p>
                  <p><strong>Sábado:</strong></p>
                  <p>8h às 12h</p>
                  <p><strong>Domingo:</strong></p>
                  <p>Fechado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-foreground-muted">
            © 2024 Sulbrasil. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground-muted">
            <Button variant="ghost" className="h-auto p-0 text-sm hover:text-foreground">
              Política de Privacidade
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-sm hover:text-foreground">
              Termos de Uso
            </Button>
            <Button variant="ghost" className="h-auto p-0 text-sm hover:text-foreground">
              Trocas e Devoluções
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};