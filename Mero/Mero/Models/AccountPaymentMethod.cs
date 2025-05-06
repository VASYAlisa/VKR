namespace Mero.Models
{
    public class AccountPaymentMethod
    {
        public int Id { get; set; }

        public string? Type { get; set; } // "Card", "PayPal"
        public string Details { get; set; } // Маскированные данные карты

        public int AccountId { get; set; }
        public virtual Account? Account { get; set; }

    }
}
