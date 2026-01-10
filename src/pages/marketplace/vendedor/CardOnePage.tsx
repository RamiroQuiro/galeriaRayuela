import {
  Star,
  Clock,
  ShoppingCart,
  Heart,
  CheckCircle,
  Badge,
} from "lucide-react";
import Button from "../../../components/ui/Button";

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  priceUnit: string;
  category: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  featured?: boolean;
}

interface FeaturedServiceCardProps {
  service: Service;
  descripcionServicio: string;
}

const FeaturedServiceCard = ({
  service,
  descripcionServicio,
}: FeaturedServiceCardProps) => {
  return (
    <section className="space-y-8">
      {/* Featured Service Hero */}
      <div className="bg-gradient-to-br from-card to-secondary rounded-3xl overflow-hidden border border-border shadow-card-hover">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-[300px] lg:h-[500px] overflow-hidden">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:bg-gradient-to-r" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-accent text-accent-foreground font-semibold px-3 py-1">
                ⭐ Servicio Destacado
              </Badge>
              <Badge className="bg-background/90 backdrop-blur">
                {service.category}
              </Badge>
            </div>

            {/* Favorite Button */}
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground hover:text-accent transition-colors" />
            </button>
          </div>

          {/* Content Section */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Calidad garantizada</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Atención personalizada</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Revisiones incluidas</span>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Desde</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold gradient-text">
                        ${service.price.toLocaleString()}
                      </span>
                      {service.priceUnit && (
                        <span className="text-muted-foreground text-lg">
                          {service.priceUnit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="primary" size="lg">
                      Consultar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-accent" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">Entrega Rápida</h4>
          <p className="text-sm text-muted-foreground">
            Recibe tu pedido en tiempo récord
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-accent" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">
            Calidad Premium
          </h4>
          <p className="text-sm text-muted-foreground">
            Materiales de primera calidad
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">
            Satisfacción Garantizada
          </h4>
          <p className="text-sm text-muted-foreground">
            100% de clientes satisfechos
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServiceCard;
