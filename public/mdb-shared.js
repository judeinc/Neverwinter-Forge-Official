window.ForgeMdb = (() => {
  const MATERIAL_ROLE_LABELS = {
    primary: "Primary / Head",
    eyes: "Eyes",
    facialHair: "Facial Hair / Extra",
    other: "Other Material",
    lod: "LOD Material"
  };

  function stem(fileName) {
    return String(fileName || "").split(/[\\/]/).pop().replace(/\.[^.]+$/i, "");
  }

  function isLodName(name) {
    return /(?:_L\d+|_LO\d+|_LOD\d+)$/i.test(String(name || ""));
  }

  function packetRole(model, packet) {
    if (packet?.materialRole) return packet.materialRole;
    const name = String(packet?.name || "").trim();
    const lower = name.toLowerCase();
    const fileStem = stem(model?.fileName || "").toLowerCase();
    if (!name) return "other";
    if (isLodName(name)) return "lod";
    if (lower.includes("eye")) return "eyes";
    if (fileStem && (lower === fileStem || lower.startsWith(`${fileStem}_`))) return "primary";
    if (lower.includes("head") || lower.includes("face")) return "primary";
    if (isFacialHairPacketName(lower)) return "facialHair";
    return "other";
  }

  function packetLabel(model, packet) {
    return packet?.materialLabel || MATERIAL_ROLE_LABELS[packetRole(model, packet)] || "Packet";
  }

  function packetKindLabel(packet) {
    const type = String(packet?.type || "").toUpperCase();
    if (type === "COLS") return "Collision";
    if (type === "HAIR") return "Hair Behavior";
    if (type === "HELM") return "Helmet Behavior";
    if (type === "HOOK") return "Hook Point";
    if (type === "WALK") return "Walk Surface";
    return type || "Packet";
  }

  function isFacialHairPacketName(lowerName) {
    const compact = String(lowerName || "").replace(/[^a-z0-9]+/g, "");
    return compact.includes("fhair")
      || compact.includes("facialhair")
      || compact.includes("beard")
      || compact.includes("mustache")
      || compact.includes("moustache")
      || compact.includes("goatee");
  }

  function nonLodPackets(model) {
    return (model?.packets || []).filter((packet) => !isLodName(packet.name));
  }

  function allMaterialPackets(model) {
    return nonLodPackets(model).filter((packet) => packet.material && Object.keys(packet.material).length);
  }

  function selectPrimaryMaterialPacket(model) {
    const packets = allMaterialPackets(model);
    if (!packets.length) return null;
    return packets.find((packet) => packetRole(model, packet) === "primary")
      || packets.find((packet) => !["eyes", "facialHair", "lod"].includes(packetRole(model, packet)))
      || packets[0];
  }

  function materialPacketsForTarget(model, target = { mode: "role", role: "primary" }) {
    const packets = allMaterialPackets(model);
    if (!packets.length) return [];
    if (target.mode === "all") return packets;
    if (target.mode === "name") {
      const wanted = new Set((target.names || []).map((name) => String(name).toLowerCase()));
      return packets.filter((packet) => wanted.has(String(packet.name || "").toLowerCase()));
    }
    const role = target.role || "primary";
    const selected = packets.filter((packet) => packetRole(model, packet) === role);
    if (selected.length) return selected;
    if (role === "primary") return [selectPrimaryMaterialPacket(model)].filter(Boolean);
    return [];
  }

  function sameMaterialTarget(left, right) {
    const leftMode = left?.mode || "role";
    const rightMode = right?.mode || "role";
    if (leftMode === "name" || rightMode === "name") {
      const leftNames = (left?.names || []).map((name) => String(name).toLowerCase()).sort().join("|");
      const rightNames = (right?.names || []).map((name) => String(name).toLowerCase()).sort().join("|");
      return leftMode === rightMode && leftNames === rightNames;
    }
    const normalizedLeft = leftMode === "all" ? { mode: "all" } : { mode: "role", role: left?.role || "primary" };
    const normalizedRight = rightMode === "all" ? { mode: "all" } : { mode: "role", role: right?.role || "primary" };
    return normalizedLeft.mode === normalizedRight.mode && normalizedLeft.role === normalizedRight.role;
  }

  function materialTargetLabel(target, definitions = []) {
    if (target?.mode === "name") return (target.names || []).join(", ") || "Named Packet";
    const definition = definitions.find((item) => sameMaterialTarget(target || { mode: "role", role: "primary" }, item));
    return definition?.label || MATERIAL_ROLE_LABELS[target?.role || "primary"] || "Primary / Head";
  }

  function materialTargetPacketCount(models, target) {
    return (models || []).reduce((total, model) => total + materialPacketsForTarget(model, target).length, 0);
  }

  function factualStatus(status) {
    if (status === "Ready") return "Parsed";
    if (status === "Needs Review") return "Parsed With Notes";
    if (status === "Will Not Work In Game") return "Parse Error";
    return status || "Parsed";
  }

  function sanitizeFixedName(value) {
    return String(value || "")
      .replace(/\.[^.]+$/i, "")
      .replace(/[<>:"/\\|?*]/g, "")
      .trim()
      .slice(0, 31);
  }

  function raceCodeFromModelName(value) {
    const match = String(value || "").match(/^[A-Za-z]_([A-Za-z0-9]{3})(?:_|$)/);
    return match ? match[1].toUpperCase() : "";
  }

  function skeletonRaceForModelRace(raceCode) {
    const race = String(raceCode || "").toUpperCase();
    if (race.length !== 3) return race;
    if (race.slice(0, 2) === "OG") return `OO${race.slice(-1)}`;
    return race;
  }

  function applyCaseStyle(template, value) {
    if (String(template || "").toLowerCase() === template) return String(value || "").toLowerCase();
    if (String(template || "").toUpperCase() === template) return String(value || "").toUpperCase();
    return value;
  }

  function renameRelatedName(value, oldBase, newBase) {
    const raw = String(value || "");
    if (!raw || !oldBase) return raw;
    const oldText = String(oldBase || "");
    if (raw.toLowerCase() === oldText.toLowerCase()) return sanitizeFixedName(newBase);
    if (raw.toLowerCase().startsWith(oldText.toLowerCase())) {
      return sanitizeFixedName(`${newBase}${raw.slice(oldText.length)}`);
    }
    const raceRenamed = renameModelRaceToken(raw, oldBase, newBase);
    return raceRenamed === raw ? raw : sanitizeFixedName(raceRenamed);
  }

  function renameModelRaceToken(value, oldBase, newBase) {
    const oldRace = raceCodeFromModelName(oldBase);
    const newRace = raceCodeFromModelName(newBase);
    if (!oldRace || !newRace || oldRace === newRace) return value;
    const match = String(value || "").match(/^([A-Za-z]_)([A-Za-z0-9]{3})((?:_|$).*)/);
    if (!match || match[2].toUpperCase() !== oldRace) return value;
    return `${match[1]}${applyCaseStyle(match[2], newRace)}${match[3]}`;
  }

  function internalNameSyncPlan(model, newName) {
    const oldBase = stem(model?.fileName);
    return nonLodPackets(model)
      .filter((packet) => String(packet.type || "").toUpperCase() !== "COLS")
      .map((packet) => {
        const oldName = String(packet.name || "");
        const nextName = renameRelatedName(oldName, oldBase, newName);
        return {
          packet: packet.index,
          type: packet.type,
          role: packetRole(model, packet),
          oldName,
          newName: nextName
        };
      })
      .filter((item) => item.oldName && item.newName && item.oldName !== item.newName);
  }

  function skeletonRefSyncPlan(model, newName) {
    const oldBase = stem(model?.fileName);
    const oldRace = raceCodeFromModelName(oldBase);
    const newRace = raceCodeFromModelName(newName);
    if (!oldRace || !newRace || oldRace === newRace) return [];
    const oldSkeletonRace = skeletonRaceForModelRace(oldRace);
    const newSkeletonRace = skeletonRaceForModelRace(newRace);
    if (oldSkeletonRace === newSkeletonRace) return [];

    return (model?.packets || [])
      .filter((packet) => packet.type === "SKIN" && packet.skeleton)
      .map((packet) => {
        const match = String(packet.skeleton || "").match(/^([A-Za-z]_)([A-Za-z0-9]{3})(_skel)$/i);
        if (!match || match[2].toUpperCase() !== oldSkeletonRace) return null;
        return {
          packet: packet.index,
          oldSkeleton: packet.skeleton,
          newSkeleton: `${match[1]}${applyCaseStyle(match[2], newSkeletonRace)}${match[3]}`
        };
      })
      .filter(Boolean);
  }

  return {
    MATERIAL_ROLE_LABELS,
    allMaterialPackets,
    internalNameSyncPlan,
    factualStatus,
    isLodName,
    materialPacketsForTarget,
    materialTargetLabel,
    materialTargetPacketCount,
    nonLodPackets,
    packetLabel,
    packetKindLabel,
    packetRole,
    raceCodeFromModelName,
    renameRelatedName,
    sameMaterialTarget,
    selectPrimaryMaterialPacket,
    skeletonRefSyncPlan,
    skeletonRaceForModelRace,
    stem
  };
})();
