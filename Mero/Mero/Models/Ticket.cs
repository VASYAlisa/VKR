namespace Mero.Models
{
    public class Ticket
    {
        public int Id { get; set; }

        public int AccountId { get; set; }
        public virtual Account Account { get; set; }

        public int EventId { get; set; }
        public virtual Event Event { get; set; }

        public int? TicketTypeId { get; set; } // Для событий без зала
        public virtual TicketType? TicketType { get; set; }

        public DateTime Date { get; set; }
        public decimal OrderAmount { get; set; } // Итоговая сумма
        public decimal OriginalAmount { get; set; }
        public decimal DiscountAmount { get; set; } // = OriginalAmount - OrderAmount  ???


        public int? PromoCodeId { get; set; }
        public virtual PromoCode? PromoCode { get; set; }

        public virtual ICollection<TicketPlace> TicketPlaces { get; set; } = new List<TicketPlace>();
    }
}
