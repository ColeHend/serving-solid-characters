using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharpAnglesTemplate.Migrations
{
    /// <inheritdoc />
    public partial class initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClassLevelSpellcastingEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Level = table.Column<int>(type: "int", nullable: false),
                    CantripsKnown = table.Column<int>(type: "int", nullable: false),
                    SpellSlotLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InvocationsKnown = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel1 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel2 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel3 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel4 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel5 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel6 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel7 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel8 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellSlotsLevel9 = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassLevelSpellcastingEntity", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pokemon",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HigherLevels = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Range = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Components = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Duration = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CastingTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRitual = table.Column<bool>(type: "bit", nullable: false),
                    IsConcentration = table.Column<bool>(type: "bit", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    School = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DamageType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttackType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Dc = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HealAtSlotLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AreaOfEffect = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pokemon", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkillEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Amount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillEntity", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    MoreData = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SpellClassNamesEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpellClassNamesEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpellClassNamesEntity_Pokemon_SpellEntityId",
                        column: x => x.SpellEntityId,
                        principalTable: "Pokemon",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HitDie = table.Column<int>(type: "int", nullable: false),
                    ProficiencyChoiceCount = table.Column<int>(type: "int", nullable: false),
                    SpellCastingAbility = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SkillsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Classes_SkillEntity_SkillsId",
                        column: x => x.SkillsId,
                        principalTable: "SkillEntity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkillsTextEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Skill = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SkillEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillsTextEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillsTextEntity_SkillEntity_SkillEntityId",
                        column: x => x.SkillEntityId,
                        principalTable: "SkillEntity",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RoleEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleEntity_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassInvocationsEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassInvocationsEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassInvocationsEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClassLevelEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Level = table.Column<int>(type: "int", nullable: false),
                    ProficiencyBonus = table.Column<int>(type: "int", nullable: false),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpellcastingId = table.Column<int>(type: "int", nullable: false),
                    Other = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true),
                    ClassEntityId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassLevelEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassLevelEntity_ClassLevelSpellcastingEntity_SpellcastingId",
                        column: x => x.SpellcastingId,
                        principalTable: "ClassLevelSpellcastingEntity",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassLevelEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ClassLevelEntity_Classes_ClassEntityId1",
                        column: x => x.ClassEntityId1,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProficiencyChoicesEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProficiencyChoicesEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProficiencyChoicesEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SavingThrowsEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingThrowsEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavingThrowsEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "StartingEquipmentEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StartingEquipmentEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StartingEquipmentEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SubclassesEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubclassesEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubclassesEntity_Classes_ClassEntityId",
                        column: x => x.ClassEntityId,
                        principalTable: "Classes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ClassInvocationDescriptionEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassInvocationsEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassInvocationDescriptionEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassInvocationDescriptionEntity_ClassInvocationsEntity_ClassInvocationsEntityId",
                        column: x => x.ClassInvocationsEntityId,
                        principalTable: "ClassInvocationsEntity",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "InvocationsEntity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClassInvocationsEntityId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvocationsEntity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvocationsEntity_ClassInvocationsEntity_ClassInvocationsEntityId",
                        column: x => x.ClassInvocationsEntityId,
                        principalTable: "ClassInvocationsEntity",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Classes_SkillsId",
                table: "Classes",
                column: "SkillsId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvocationDescriptionEntity_ClassInvocationsEntityId",
                table: "ClassInvocationDescriptionEntity",
                column: "ClassInvocationsEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassInvocationsEntity_ClassEntityId",
                table: "ClassInvocationsEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLevelEntity_ClassEntityId",
                table: "ClassLevelEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLevelEntity_ClassEntityId1",
                table: "ClassLevelEntity",
                column: "ClassEntityId1");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLevelEntity_SpellcastingId",
                table: "ClassLevelEntity",
                column: "SpellcastingId");

            migrationBuilder.CreateIndex(
                name: "IX_InvocationsEntity_ClassInvocationsEntityId",
                table: "InvocationsEntity",
                column: "ClassInvocationsEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_ProficiencyChoicesEntity_ClassEntityId",
                table: "ProficiencyChoicesEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleEntity_UserId",
                table: "RoleEntity",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavingThrowsEntity_ClassEntityId",
                table: "SavingThrowsEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_SkillsTextEntity_SkillEntityId",
                table: "SkillsTextEntity",
                column: "SkillEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_SpellClassNamesEntity_SpellEntityId",
                table: "SpellClassNamesEntity",
                column: "SpellEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_StartingEquipmentEntity_ClassEntityId",
                table: "StartingEquipmentEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_SubclassesEntity_ClassEntityId",
                table: "SubclassesEntity",
                column: "ClassEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClassInvocationDescriptionEntity");

            migrationBuilder.DropTable(
                name: "ClassLevelEntity");

            migrationBuilder.DropTable(
                name: "InvocationsEntity");

            migrationBuilder.DropTable(
                name: "ProficiencyChoicesEntity");

            migrationBuilder.DropTable(
                name: "RoleEntity");

            migrationBuilder.DropTable(
                name: "SavingThrowsEntity");

            migrationBuilder.DropTable(
                name: "SkillsTextEntity");

            migrationBuilder.DropTable(
                name: "SpellClassNamesEntity");

            migrationBuilder.DropTable(
                name: "StartingEquipmentEntity");

            migrationBuilder.DropTable(
                name: "SubclassesEntity");

            migrationBuilder.DropTable(
                name: "ClassLevelSpellcastingEntity");

            migrationBuilder.DropTable(
                name: "ClassInvocationsEntity");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Pokemon");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "SkillEntity");
        }
    }
}
