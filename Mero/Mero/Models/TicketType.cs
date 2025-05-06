namespace Mero.Models
{
    public class TicketType
    {
        public int Id { get; set; }
        public string Name { get; set; } // Например, "Танцпол", "Meet & Greet"
        public decimal Price { get; set; } // Цена для этого типа билета
        public int? MaxAvailable { get; set; } // Максимальное количество билетов этого типа
        public int SoldCount { get; set; } // Количество проданных билетов

        public int EventId { get; set; }
        public virtual Event Event { get; set; }

        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();

    }
}
