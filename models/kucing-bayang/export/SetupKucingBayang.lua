--[[
Kucing Bayang: set up colours and materials after importing the FBX.

Usage in Roblox Studio:
  1. Import export/kucing_bayang_roblox.fbx with the 3D Importer.
  2. Select the imported Model in the Explorer.
  3. Paste this whole script into the Command Bar (View > Command Bar) and press Enter.

Glowing parts use Neon, the rest of the cat is purplish-black.
Effects (smoke, ribbons, sparks) are not in the FBX; build them with
ParticleEmitter / Beam / Trail.
]]

local FUR = Color3.fromRGB(26, 14, 36)

local LOOK = {
	Cat_Body = { FUR, Enum.Material.SmoothPlastic },
	Cat_Ears = { FUR, Enum.Material.SmoothPlastic },
	Cat_EarsInner = { Color3.fromRGB(62, 16, 54), Enum.Material.SmoothPlastic },
	Cat_Nose = { Color3.fromRGB(22, 10, 27), Enum.Material.SmoothPlastic },
	Cat_Claws = { Color3.fromRGB(170, 160, 186), Enum.Material.SmoothPlastic },
	Cat_Eyes = { Color3.fromRGB(255, 45, 205), Enum.Material.Neon },
	Cat_Glow_ForeheadDiamond = { Color3.fromRGB(255, 30, 190), Enum.Material.Neon },
	Cat_Glow_Markings = { Color3.fromRGB(150, 40, 255), Enum.Material.Neon },
}

local model = game:GetService("Selection"):Get()[1]
assert(model, "Select the imported cat Model first")

local body
for _, part in ipairs(model:GetDescendants()) do
	if part:IsA("MeshPart") then
		local look = LOOK[part.Name]
		if not look and string.sub(part.Name, 1, 8) == "Cat_Fur_" then
			look = { FUR, Enum.Material.SmoothPlastic } -- fur clump groups
		end
		if look then
			part.Color, part.Material = look[1], look[2]
		end
		part.Anchored = true
		part.CanCollide = part.Name == "Cat_Body"
		part.CastShadow = part.Material ~= Enum.Material.Neon
		if part.Name == "Cat_Body" then
			body = part
		end
	end
end

if model:IsA("Model") and body then
	model.PrimaryPart = body
end
print("Kucing Bayang ready:", model:GetFullName())
