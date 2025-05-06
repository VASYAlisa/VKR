using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mero.Models;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace Mero.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly MeroContext _context;

        public AccountController(UserManager<User> userManager, SignInManager<User> signInManager, MeroContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = "Неверные входные данные",
                    errors = ModelState.Values.SelectMany(e => e.Errors.Select(er => er.ErrorMessage))
                });
            }

            var user = new User { Email = model.Email, UserName = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Пользователь не добавлен",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            // Установка роли User
            await _userManager.AddToRoleAsync(user, "user");

            // Создание связанного Account
            var account = new Account();
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            // Связываем User с Account
            user.AccountId = account.Id;
            await _userManager.UpdateAsync(user);

            // Установка куки
            await _signInManager.SignInAsync(user, isPersistent: false);

            return Ok(new
            {
                message = "Добавлен новый пользователь",
                userName = user.UserName,
                userRole = "user",
                accountId = account.Id
            });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = "Неверные входные данные",
                    errors = ModelState.Values.SelectMany(e => e.Errors.Select(er => er.ErrorMessage))
                });
            }

            var result = await _signInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, lockoutOnFailure: false);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Вход не выполнен",
                    errors = new[] { "Неправильный логин и (или) пароль" }
                });
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest(new
                {
                    message = "Вход не выполнен",
                    errors = new[] { "Пользователь не найден" }
                });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault();
            var accountId = user.AccountId;

            if (!accountId.HasValue)
            {
                // Если Account не существует, создаём его
                var account = new Account();
                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();

                user.AccountId = account.Id;
                await _userManager.UpdateAsync(user);
                accountId = account.Id;
            }

            return Ok(new
            {
                message = "Выполнен вход",
                userName = user.UserName,
                userRole,
                accountId
            });
        }

        [HttpPost("logoff")]
        public async Task<IActionResult> LogOff()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
            {
                return Unauthorized(new { message = "Сначала выполните вход" });
            }

            await _signInManager.SignOutAsync();
            return Ok(new { message = "Выполнен выход", userName = user.UserName });
        }

        [HttpGet("isauthenticated")]
        public async Task<IActionResult> IsAuthenticated()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
            {
                return Unauthorized(new { message = "Вы Гость. Пожалуйста, выполните вход" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault();
            return Ok(new
            {
                message = "Сессия активна",
                userName = user.UserName,
                userRole,
                accountId = user.AccountId
            });
        }

        private Task<User> GetCurrentUserAsync() => _userManager.GetUserAsync(HttpContext.User);
    }

    // Модели для входа и регистрации
    public class RegisterViewModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginViewModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}