using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Mero.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HallsController : ControllerBase
    {
        private readonly MeroContext _context;

        public HallsController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Halls
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Hall>>> GetHalls()
        {
            return await _context.Halls
                .Include(h => h.Places)
                .Include(h => h.Location)
                .ToListAsync();
        }

        // GET: api/Halls/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Hall>> GetHall(int id)
        {
            var hall = await _context.Halls
                .Include(h => h.Places)
                .Include(h => h.Location)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (hall == null)
            {
                return NotFound();
            }

            return hall;
        }

        // POST: api/Halls
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<Hall>> CreateHall([FromBody] HallCreateDto hallDto)
        {
            try
            {
                if (hallDto == null)
                {
                    return BadRequest("Тело запроса пустое.");
                }

                var location = await _context.Locations.FindAsync(hallDto.LocationId);
                if (location == null)
                {
                    return BadRequest("Указанная локация не существует.");
                }

                if (string.IsNullOrEmpty(hallDto.Name))
                {
                    return BadRequest("Название зала обязательно.");
                }

                if (string.IsNullOrEmpty(hallDto.Layout))
                {
                    return BadRequest("Поле layout обязательно.");
                }

                HallLayout layout;
                try
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    layout = JsonSerializer.Deserialize<HallLayout>(hallDto.Layout, options);
                    Console.WriteLine($"Deserialized layout: {JsonSerializer.Serialize(layout)}");

                    if (layout?.Rows == null || !layout.Rows.Any())
                    {
                        return BadRequest("Неверная структура layout: отсутствует или пуст массив rows.");
                    }

                    foreach (var row in layout.Rows)
                    {
                        if (string.IsNullOrEmpty(row.RowNumber) || row.Seats == null || !row.Seats.Any())
                        {
                            return BadRequest($"Неверные данные ряда: rowNumber={row.RowNumber}, seats={(row.Seats == null ? "null" : row.Seats.Count)}");
                        }
                        if (row.Count != row.Seats.Count)
                        {
                            return BadRequest($"Несоответствие количества мест: rowNumber={row.RowNumber}, count={row.Count}, seats={row.Seats.Count}");
                        }
                        foreach (var seat in row.Seats)
                        {
                            if (seat.SeatNumber <= 0 || seat.Price < 0 || string.IsNullOrEmpty(seat.Color))
                            {
                                return BadRequest($"Неверные данные места: seatNumber={seat.SeatNumber}, price={seat.Price}, color={seat.Color}");
                            }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"Ошибка десериализации layout: {ex.Message}");
                    return BadRequest($"Неверный формат layout: {ex.Message}");
                }

                var hall = new Hall
                {
                    Name = hallDto.Name,
                    Layout = hallDto.Layout,
                    LocationId = hallDto.LocationId,
                    Places = new List<Place>()
                };

                _context.Halls.Add(hall);
                await _context.SaveChangesAsync();

                var places = layout.Rows.SelectMany(row => row.Seats.Select(seat => new Place
                {
                    HallId = hall.Id,
                    RowNumber = row.RowNumber,
                    SeatNumber = seat.SeatNumber,
                    Price = seat.Price,
                    Color = seat.Color,
                    IsBooked = false
                })).ToList();

                _context.Places.AddRange(places);
                await _context.SaveChangesAsync();

                var createdHall = await _context.Halls
                    .Include(h => h.Places)
                    .Include(h => h.Location)
                    .FirstOrDefaultAsync(h => h.Id == hall.Id);

                return CreatedAtAction(nameof(GetHall), new { id = hall.Id }, createdHall);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при создании зала: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }

        // PUT: api/Halls/5
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateHall(int id, [FromBody] HallUpdateDto hallDto)
        {
            try
            {
                if (hallDto == null)
                {
                    return BadRequest("Тело запроса пустое.");
                }

                var hall = await _context.Halls
                    .Include(h => h.Places)
                    .FirstOrDefaultAsync(h => h.Id == id);
                if (hall == null)
                {
                    return NotFound();
                }

                var location = await _context.Locations.FindAsync(hallDto.LocationId);
                if (location == null)
                {
                    return BadRequest("Указанная локация не существует.");
                }

                if (string.IsNullOrEmpty(hallDto.Layout))
                {
                    return BadRequest("Поле layout обязательно.");
                }

                HallLayout layout;
                try
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    layout = JsonSerializer.Deserialize<HallLayout>(hallDto.Layout, options);
                    Console.WriteLine($"Deserialized layout: {JsonSerializer.Serialize(layout)}");

                    if (layout?.Rows == null || !layout.Rows.Any())
                    {
                        return BadRequest("Неверная структура layout: отсутствует или пуст массив rows.");
                    }

                    foreach (var row in layout.Rows)
                    {
                        if (string.IsNullOrEmpty(row.RowNumber) || row.Seats == null || !row.Seats.Any())
                        {
                            return BadRequest($"Неверные данные ряда: rowNumber={row.RowNumber}, seats={(row.Seats == null ? "null" : row.Seats.Count)}");
                        }
                        if (row.Count != row.Seats.Count)
                        {
                            return BadRequest($"Несоответствие количества мест: rowNumber={row.RowNumber}, count={row.Count}, seats={row.Seats.Count}");
                        }
                        foreach (var seat in row.Seats)
                        {
                            if (seat.SeatNumber <= 0 || seat.Price < 0 || string.IsNullOrEmpty(seat.Color))
                            {
                                return BadRequest($"Неверные данные места: seatNumber={seat.SeatNumber}, price={seat.Price}, color={seat.Color}");
                            }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"Ошибка десериализации layout: {ex.Message}");
                    return BadRequest($"Неверный формат layout: {ex.Message}");
                }

                hall.Name = hallDto.Name;
                hall.Layout = hallDto.Layout;
                hall.LocationId = hallDto.LocationId;

                _context.Places.RemoveRange(hall.Places);
                var places = layout.Rows.SelectMany(row => row.Seats.Select(seat => new Place
                {
                    HallId = hall.Id,
                    RowNumber = row.RowNumber,
                    SeatNumber = seat.SeatNumber,
                    Price = seat.Price,
                    Color = seat.Color,
                    IsBooked = false
                })).ToList();

                _context.Places.AddRange(places);
                await _context.SaveChangesAsync();

                var updatedHall = await _context.Halls
                    .Include(h => h.Places)
                    .Include(h => h.Location)
                    .FirstOrDefaultAsync(h => h.Id == id);

                return Ok(updatedHall);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при обновлении зала: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }

        // DELETE: api/Halls/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteHall(int id)
        {
            try
            {
                var hall = await _context.Halls.FindAsync(id);
                if (hall == null)
                {
                    return NotFound();
                }

                _context.Halls.Remove(hall);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при удалении зала: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }
    }

    public class HallCreateDto
    {
        public string Name { get; set; }
        public int LocationId { get; set; }
        public string Layout { get; set; }
    }

    public class HallUpdateDto
    {
        public string Name { get; set; }
        public int LocationId { get; set; }
        public string Layout { get; set; }
    }
}