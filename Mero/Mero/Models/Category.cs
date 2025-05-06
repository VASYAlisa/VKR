using Microsoft.Extensions.Logging;

namespace Mero.Models
{
    public class Category
    {
        public Category()
        {
            Events = new HashSet<Event>();
        }
        public int Id { get; set; }
        public string Title { get; set; }

        public virtual ICollection<Event> Events { get; set; }
    }
}
