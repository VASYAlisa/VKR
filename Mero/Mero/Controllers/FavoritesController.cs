using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace Mero.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FavoritesController : ControllerBase
    {
        private readonly MeroContext _context;

        public FavoritesController(MeroContext context)
        {
            _context = context;
        }

        // GET: api/Favorites/ByAccount/5 - Получение избранного аккаунта
        [HttpGet("ByAccount/{accountId}")]
        public async Task<ActionResult<IEnumerable<FavoriteDto>>> GetFavoritesByAccount(int accountId)
        {
            try
            {
                var favorites = await _context.Favorites
                    .Where(f => f.AccountId == accountId)
                    .Include(f => f.Event)
                        .ThenInclude(e => e.Location)
                    .Include(f => f.Event)
                        .ThenInclude(e => e.Categories)
                    .Where(f => f.Event != null)
                    .ToListAsync();

                // Логируем количество найденных записей
                Console.WriteLine($"Found {favorites.Count} favorites for accountId {accountId}");

                var result = favorites.Select(f => MapToDto(f)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Логируем полную информацию об ошибке
                Console.WriteLine($"Error in GetFavoritesByAccount: {ex.Message}\nStackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // POST: api/Favorites - Добавление в избранное
        [HttpPost]
        public async Task<ActionResult<FavoriteDto>> AddToFavorites(FavoriteCreateDto dto)
        {
            try
            {
                // Проверка существования аккаунта и события
                if (!await _context.Accounts.AnyAsync(a => a.Id == dto.AccountId))
                    return BadRequest("Account not found");

                if (!await _context.Events.AnyAsync(e => e.Id == dto.EventId))
                    return BadRequest("Event not found");

                // Проверка на дубликат
                if (await _context.Favorites
                    .AnyAsync(f => f.AccountId == dto.AccountId && f.EventId == dto.EventId))
                {
                    return Conflict("Event already in favorites");
                }

                var favorite = new Favorites
                {
                    AccountId = dto.AccountId,
                    EventId = dto.EventId
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                // Получаем полные данные для ответа
                var result = await _context.Favorites
                    .Include(f => f.Event)
                        .ThenInclude(e => e.Location)
                    .Include(f => f.Event)
                        .ThenInclude(e => e.Categories)
                    .FirstOrDefaultAsync(f => f.Id == favorite.Id);

                if (result == null || result.Event == null)
                    return NotFound("Created favorite not found or event is missing");

                return CreatedAtAction(nameof(GetFavoritesByAccount),
                    new { accountId = dto.AccountId },
                    MapToDto(result));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddToFavorites: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // DELETE: api/Favorites/5 - Удаление из избранного
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFromFavorites(int id)
        {
            try
            {
                var favorite = await _context.Favorites.FindAsync(id);
                if (favorite == null)
                {
                    return NotFound();
                }

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in RemoveFromFavorites: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // DELETE: api/Favorites/ByAccountAndEvent?accountId=5&eventId=10 - Альтернативное удаление
        [HttpDelete("ByAccountAndEvent")]
        public async Task<IActionResult> RemoveFromFavorites([FromQuery] int accountId, [FromQuery] int eventId)
        {
            try
            {
                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.AccountId == accountId && f.EventId == eventId);

                if (favorite == null)
                {
                    return NotFound();
                }

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in RemoveFromFavorites (ByAccountAndEvent): {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        private bool FavoriteExists(int id)
        {
            return _context.Favorites.Any(e => e.Id == id);
        }

        private FavoriteDto MapToDto(Favorites favorite)
        {
            return new FavoriteDto
            {
                Id = favorite.Id,
                AccountId = favorite.AccountId,
                EventId = favorite.EventId,
                Event = favorite.Event == null ? null : new EventShortDto
                {
                    Id = favorite.Event.Id,
                    Title = favorite.Event.Title,
                    Date = favorite.Event.Date,
                    Image = favorite.Event.Image,
                    Location = favorite.Event.Location != null ? new LocationShortDto
                    {
                        Id = favorite.Event.Location.Id,
                        Name = favorite.Event.Location.Name
                    } : null,
                    Categories = favorite.Event.Categories?.Select(c => c.Title).ToList() ?? new List<string>()
                }
            };
        }
    }

    // DTO классы
    public class FavoriteDto
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public int EventId { get; set; }
        public EventShortDto Event { get; set; }
    }

    public class EventShortDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime? Date { get; set; }
        public string Image { get; set; }
        public LocationShortDto Location { get; set; }
        public List<string> Categories { get; set; }
    }

    public class LocationShortDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class FavoriteCreateDto
    {
        [Required]
        public int AccountId { get; set; }

        [Required]
        public int EventId { get; set; }
    }
}