using Microsoft.Extensions.Logging;

namespace Mero.Models
{
    public class Account
    {
        public Account() 
        {
            Tickets = new HashSet<Ticket>();
            AccountPaymentMethods = new HashSet<AccountPaymentMethod>();
        }
        public int Id { get; set; }
        

        public virtual ICollection<Ticket> Tickets { get; set; }
        public virtual ICollection<AccountPaymentMethod> AccountPaymentMethods { get; set; }
        public virtual ICollection<Favorites>? Favourites { get; set; }
    }
}
