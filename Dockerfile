# Use the official .NET 6 runtime image as the base
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80

# Use .NET SDK image for building the project
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build

# Install Node.js and npm
RUN apt-get update && apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
    apt-get install -y nodejs

# Now continue with the usual .NET build steps
WORKDIR /src
COPY . .
RUN dotnet restore "SharpAnglesTemplate.csproj"
RUN dotnet build "SharpAnglesTemplate.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SharpAnglesTemplate.csproj" -c Release -o /app/publish

# The final stage for the runtime environment
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SharpAnglesTemplate.dll"]