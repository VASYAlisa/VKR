namespace Mero.Models
{
    public class Favorites
    {
        public int Id { get; set; }

        public int AccountId { get; set; }
        public virtual Account? Account { get; set; }

        public int EventId { get; set; }
        public virtual Event? Event { get; set; }
    }
}
