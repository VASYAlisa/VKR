using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System.Linq;
using System.Threading.Tasks;

namespace Mero.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly MeroContext _context;

        public PlacesController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Places?hallId=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Place>>> GetPlaces([FromQuery] int? hallId)
        {
            var query = _context.Places.AsQueryable();
            if (hallId.HasValue)
            {
                query = query.Where(p => p.HallId == hallId.Value);
            }
            return await query
                .Include(p => p.Hall)
                .ToListAsync();
        }

        // GET: api/Places/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Place>> GetPlace(int id)
        {
            var place = await _context.Places
                .Include(p => p.Hall)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (place == null)
            {
                return NotFound();
            }

            return place;
        }

        // GET: api/Places/ByHall/5
        [HttpGet("ByHall/{hallId}")]
        public async Task<ActionResult<HallLayoutDto>> GetPlacesByHall(int hallId)
        {
            var places = await _context.Places
                .Where(p => p.HallId == hallId)
                .ToListAsync();

            if (!places.Any())
            {
                return NotFound("Места для данного зала не найдены");
            }

            // Группируем места по рядам
            var rows = places
                .GroupBy(p => p.RowNumber)
                .Select(g => new HallRowDto
                {
                    RowNumber = g.Key,
                    Count = g.Count(),
                    Seats = g.Select(p => new HallSeatDto
                    {
                        Id = p.Id,
                        SeatNumber = p.SeatNumber,
                        Price = p.Price,
                        Color = p.Color,
                        IsBooked = p.IsBooked
                    })
                    .OrderBy(s => s.SeatNumber)
                    .ToList()
                })
                .OrderBy(r => r.RowNumber)
                .ToList();

            return new HallLayoutDto
            {
                Rows = rows
            };
        }

        // PUT: api/Places/5/book
        [HttpPut("{id}/book")]
        [Authorize(Roles = "admin,user")]
        public async Task<IActionResult> BookPlace(int id, [FromBody] BookPlaceDto bookDto)
        {
            try
            {
                var place = await _context.Places.FindAsync(id);
                if (place == null)
                {
                    return NotFound();
                }

                if (place.IsBooked)
                {
                    return BadRequest("Место уже забронировано.");
                }

                place.IsBooked = bookDto.IsBooked;
                await _context.SaveChangesAsync();

                return Ok(place);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при бронировании места: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }
    }

    public class BookPlaceDto
    {
        public bool IsBooked { get; set; }
    }

    // DTO для формата, ожидаемого SeatGrid
    public class HallLayoutDto
    {
        public List<HallRowDto> Rows { get; set; }
    }

    public class HallRowDto
    {
        public string RowNumber { get; set; }
        public int Count { get; set; }
        public List<HallSeatDto> Seats { get; set; }
    }

    public class HallSeatDto
    {
        public int Id { get; set; }
        public int SeatNumber { get; set; }
        public decimal Price { get; set; }
        public string Color { get; set; }
        public bool IsBooked { get; set; }
    }
}