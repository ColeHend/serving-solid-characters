using System.Text.Json;

namespace SolidCharacters.Services.Ai;

// Normalized request/DTOs shared between the client harness and the proxy. Property names bind
// case-insensitively (ASP.NET Core web defaults), so the client's camelCase JSON maps here.

public record AiToolCallDto(string Id, string Name, JsonElement Input);

public record AiToolResultDto(string ToolCallId, string Content, bool? IsError);

public record AiMessageDto(
    string Role,
    string? Text,
    List<AiToolCallDto>? ToolCalls,
    List<AiToolResultDto>? ToolResults);

public record AiToolDefDto(string Name, string Description, JsonElement InputSchema);

public record ChatRequest(
    string Provider,
    string Model,
    string? System,
    int? MaxTokens,
    List<AiMessageDto> Messages,
    List<AiToolDefDto>? Tools);

public record CredentialRequest(string Provider, string ApiKey);
