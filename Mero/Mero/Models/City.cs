using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Mero.Models
{
    public class City
    {
        public City()
        {
            Locations = new List<Location>();
        }

        public int Id { get; set; }

        [Required(ErrorMessage = "Название города обязательно")]
        public string Title { get; set; }

        [JsonIgnore]
        public virtual ICollection<Location> Locations { get; set; }
    }
}
