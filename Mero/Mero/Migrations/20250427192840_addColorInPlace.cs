using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mero.Migrations
{
    /// <inheritdoc />
    public partial class addColorInPlace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Places",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Places");
        }
    }
}
