using System.Text.Json.Serialization;

namespace Mero.Models
{
    // Модели для десериализации Layout
    public class HallLayout
    {
        [JsonPropertyName("rows")]
        public List<HallRow> Rows { get; set; }
    }

    public class HallRow
    {
        public string RowNumber { get; set; }
        public int Count { get; set; }
        public List<HallSeat> Seats { get; set; }
    }

    public class HallSeat
    {
        public int SeatNumber { get; set; }
        public decimal Price { get; set; }
        public string Color { get; set; }
    }
}
