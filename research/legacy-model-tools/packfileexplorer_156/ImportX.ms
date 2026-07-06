--------------------------------------------------------------------------------------
--- File:			XFile.ms
--- Version:		2.11
--- Description:	Direct X File Importer / Exporter
--- Author:			Dave Gaunt
--- Platform:		Max Script
---
--- Copyright (c) 2005-2006 Dave Gaunt
--------------------------------------------------------------------------------------
--- History:
---		21-Aug-2005	DMG		Initial Revision
---		11-Feb-2006	DMG		First Major Rewrite
---		08-Apr-2006 DMG		Second Major Rewrite
--------------------------------------------------------------------------------------

--- Note: This Is NOT A General Purpose X File Importer! It Makes A Lot Of Assumptions
--- 	  About The Formating Of The X File That It's Parsing!

--------------------------------------------------------------------------------------
-- Import Defaults
--------------------------------------------------------------------------------------
global g_bHideUnusedBones = true
global g_bTransparentMesh = false
global g_bFreezeSkin = true

--------------------------------------------------------------------------------------
-- Export Defaults
--------------------------------------------------------------------------------------
global g_bSelectAllObjects = true

--------------------------------------------------------------------------------------
-- Globals
--------------------------------------------------------------------------------------
struct SkeletonNode( strBoneName, v2BoneScale, v3BoneEnd, v4BoneARGB, maxBone, mat34Bone, nParentIndex )
struct RenderGroup( maxMesh, nMaterialIndex, nBlendMode, bDoubleSided, bFullBright )
struct VertexWeight( aBoneIndecies = #(), aWeights = #() )
global g_nCurrentTokenIndex = 0
global g_aCurrentLineTokens = ""
global g_strCurrentLine = ""

--------------------------------------------------------------------------------------
--- Find The Next Specified Token In The File
--------------------------------------------------------------------------------------
fn FindNextToken file strToken =
(
	nTokenCount = g_aCurrentLineTokens.count

	while( false == eof file ) do
	(
		while( 0 == nTokenCount ) do
		(
			-- Reached The End Of File Without Finding The Token
			if( eof file ) do
				return false

			g_strCurrentLine = ReadLine file
			g_aCurrentLineTokens = FilterString g_strCurrentLine " \t"
			nTokenCount = g_aCurrentLineTokens.count
			g_nCurrentTokenIndex = 0
		)

		while( g_nCurrentTokenIndex < nTokenCount ) do
		(
			g_nCurrentTokenIndex += 1
--			Format "Token % == %\n" g_nCurrentTokenIndex lineTokens[ g_nCurrentTokenIndex ]
			if( strToken == g_aCurrentLineTokens[ g_nCurrentTokenIndex ] ) do
				return true
		)

		nTokenCount = 0
	)

	-- Reached The End Of File Without Finding The Token
	return false
)

--------------------------------------------------------------------------------------
--- Find The Next Token In The File From The Specified Array Of Tokens
--------------------------------------------------------------------------------------
fn FindTokenInSet file aTokenSet =
(
	nTokenCount = g_aCurrentLineTokens.count

	while( false == eof file ) do
	(
		while( 0 == nTokenCount ) do
		(
			-- Reached The End Of File Without Finding Any Of The Specified Tokens
			if( eof file ) do
				return 0

			g_strCurrentLine = ReadLine file
			g_aCurrentLineTokens = FilterString g_strCurrentLine " \t"
			nTokenCount = g_aCurrentLineTokens.count
			g_nCurrentTokenIndex = 0
		)

		while( g_nCurrentTokenIndex < nTokenCount ) do
		(
			g_nCurrentTokenIndex += 1
--			Format "Token % == %\n" g_nCurrentTokenIndex g_aCurrentLineTokens[ g_nCurrentTokenIndex ]
			for nSearchIndex = 1 to aTokenSet.count do
			(
				if( aTokenSet[ nSearchIndex ] == g_aCurrentLineTokens[ g_nCurrentTokenIndex ] ) do
					return nSearchIndex
			)
		)

		nTokenCount = 0
	)

	-- Reached The End Of File Without Finding Any Of The Specified Tokens
	return 0
)

--------------------------------------------------------------------------------------
--- Get The Next Token On The Current Line
--------------------------------------------------------------------------------------
fn GetNextTokenOnCurrentLine =
(
	if( g_nCurrentTokenIndex < g_aCurrentLineTokens.count ) do
	(
		g_nCurrentTokenIndex += 1
		return g_aCurrentLineTokens[ g_nCurrentTokenIndex ]
	)

	-- No More Tokens On This Line!
	return ""
)

--------------------------------------------------------------------------------------
--- Print Float
--------------------------------------------------------------------------------------
fn PrintFloat fNumber =
(
	local nNumDigits = 6
	strDigits = ""
	
	if( fNumber < 0.0 ) do
		strDigits += "-"
		
	fNumber = ( abs fNumber ) + 0.0000005
	strDigits += ( fNumber as integer ) as string
	fNumber -= fNumber as integer
	strDigits += "."
	
	for i = 1 to nNumDigits do
	(
		fNumber *= 10.0
		strDigits += ( fNumber as integer ) as string
		fNumber -= fNumber as integer
	)
	
	return strDigits
)

--------------------------------------------------------------------------------------
--- Read A 4 x 4 Matrix Into A Max 3 x 4 Matrix
--------------------------------------------------------------------------------------
fn ReadMatrix44 lineStream =
(
	mat34 = Matrix3 0
	mat34.row1 = Point3	( ReadValue lineStream as float ) ( ReadValue lineStream as float ) ( ReadValue lineStream as float )
	fRow1_w = ReadValue lineStream as float
	mat34.row2 = Point3	( ReadValue lineStream as float ) ( ReadValue lineStream as float ) ( ReadValue lineStream as float )
	fRow2_w = ReadValue lineStream as float
	mat34.row3 = Point3	( ReadValue lineStream as float ) ( ReadValue lineStream as float ) ( ReadValue lineStream as float )
	fRow3_w = ReadValue lineStream as float
	mat34.row4 = Point3	( ReadValue lineStream as float ) ( ReadValue lineStream as float ) ( ReadValue lineStream as float )
	fRow4_w = ReadValue lineStream as float

	if( 0.0 != fRow1_w ) or ( 0.0 != fRow2_w ) or ( 0.0 != fRow3_w ) or ( 1.0 != fRow4_w ) do
	(
		Format "Invalid Matrix, Column 4 == % % % %\n" fRow1_w fRow2_w fRow3_w fRow4_w
		return Matrix3 1
	)
	
	return mat34
)

--------------------------------------------------------------------------------------
--- Skip X File Template Definition
--------------------------------------------------------------------------------------
fn SkipTemplate fileXFile =
(
	if( 2 == g_aCurrentLineTokens.count ) do
		Format "Found Template - %\n" g_aCurrentLineTokens[ 2 ]
		
	FindNextToken fileXFile "}"
)

--------------------------------------------------------------------------------------
--- Read The X File Version Number
--------------------------------------------------------------------------------------
fn ReadVersion fileXFile =
(
	if( FindNextToken fileXFile "{" ) do
	(
		lineStream = (ReadLine fileXFile) as StringStream
		uMajor = ReadValue lineStream as integer
		uMinor = ReadValue lineStream as integer

		if(( 1 == uMajor ) and ( 2 == uMinor )) do
			return 0
	)
	
	MessageBox "Error : Wrong XFile Version"
	exit
)

--------------------------------------------------------------------------------------
--- Write The X File Header
--------------------------------------------------------------------------------------
fn WriteHeader fileOut =
(
	Format "xof 0303txt 0032\n\n" to:fileOut
	Format "Template XFileVersion\n{\n\t<5d2f08ee-553b-4e35-b506-0ee91528504a>\n\tWORD\tuMajor;\n\tWORD\tuMinor;\n\tstring\tstrCopyright;\n}\n\n" to:fileOut
	Format "Template MeshRenderGroupList\n{\n\t<5d2f08ee-553b-4e35-b506-0ee91528504b>\n\tWORD uRenderGroupCount;\n}\n\n" to:fileOut

	Format "Template RenderGroup\n{\n\t<5d2f08ee-553b-4e35-b506-0ee91528504c>\n" to:fileOut
	Format "\tWORD uVertexCount;\n\tWORD uFaceCount;\n\tBYTE uMaterialIndex;\n\n" to:fileOut
	Format "\tBYTE uBlendMode;\n\t// 0 = Opaque\n\t// 1 = ColourKey\n\t// 2 = Additive\n\t// 3 = Subtractive\n\n" to:fileOut
	Format "\tBYTE bDoubleSided;\n\t// 0 = Single Sided\n\t// 1 = Double Sided\n\n" to:fileOut
	Format "\tBYTE bFullBright;\n\t// 0 = Normal Lighting\n\t// 1 = Full Bright\n}\n\n" to:fileOut

	Format "Template ColourARGB\n{\n\t<5d2f08ee-553b-4e35-b506-0ee91528504d>\n\tfloat fAlpha;\n\tfloat fRed;\n\tfloat fGreen;\n\tfloat fBlue;\n}\n\n" to:fileOut
	Format "Template BoneInfo\n{\n\t<5d2f08ee-553b-4e35-b506-0ee91528504e>\n\tVector\t\tv3Bone;\n\tfloat\t\tfWidth;\n\tfloat\t\tfHeight;\n\tColourARGB\targbColour;\n}\n\n" to:fileOut
	Format "XFileVersion\n{\n\t1;2;\n\t\"Created With Max Script X File Exporter Copyright (c) 2005 - 2006 By Dave Gaunt.\";\n}\n\n" to:fileOut
	Format "Frame SceneRoot\n{\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Read The Vertices For All Render Groups
--------------------------------------------------------------------------------------
fn ReadVerts fileXFile aRenderGroups =
(
	nTotalVerts = 0
	nXFileVerts = g_aCurrentLineTokens[ 1 ] as integer
	
	for nGroupIndex=1 to aRenderGroups.count do
	(
		nVertexCount = aRenderGroups[ nGroupIndex ].maxMesh.numVerts

		for nVertexIndex = 1 to nVertexCount do
		(
			lineStream = ReadLine fileXFile as StringStream

			vertex = Point3							\
				( ReadValue lineStream as float )	\
				( ReadValue lineStream as float )	\
				( ReadValue lineStream as float )

			SetVert aRenderGroups[ nGroupIndex ].maxMesh nVertexIndex vertex.x vertex.z vertex.y
		)
		
		meshOps.unifyNormal aRenderGroups[ nGroupIndex ].maxMesh
		nTotalVerts += nVertexCount
	)
	
	if( nTotalVerts != g_aCurrentLineTokens[ 1 ] as integer ) do
		Format "Error : Mesh Has % Vertices, Groups Total % Vertices\n" nXFileVerts nTotalVerts
	
	return nTotalVerts
)

--------------------------------------------------------------------------------------
--- Write The Vertices For All Render Groups
--------------------------------------------------------------------------------------
fn WriteVerts fileOut aObjectSet uMeshCount uVertexCount =
(
	uCurrentMesh = 0
	Format "\t\t%;\n" uVertexCount to:fileOut

	for uGroupIndex=1 to aObjectSet.count do
	(
		mesh = aObjectSet[ uGroupIndex ]
		if( "Editable_mesh" == classof mesh.baseobject as string ) do
		(
			uGroupVerts = mesh.verts.count
			uCurrentMesh += 1
			
			if( uCurrentMesh == uMeshCount ) do
				uGroupVerts -= 1
		
			for uVertexIndex=1 to uGroupVerts do
			(
				Format "\t\t%;%;%;,\n" ( PrintFloat mesh.verts[ uVertexIndex ].pos.x )		\
									   ( PrintFloat mesh.verts[ uVertexIndex ].pos.z )		\
								       ( PrintFloat mesh.verts[ uVertexIndex ].pos.y ) to:fileOut
			)
			
			if( uCurrentMesh == uMeshCount ) do
			(
				Format "\t\t%;%;%;;\n\n" ( PrintFloat mesh.verts[ mesh.verts.count ].pos.x )	\
										 ( PrintFloat mesh.verts[ mesh.verts.count ].pos.z )	\
										 ( PrintFloat mesh.verts[ mesh.verts.count ].pos.y ) to:fileOut
			)
		)
	)
)

--------------------------------------------------------------------------------------
--- Read The Faces For All Render Groups
--------------------------------------------------------------------------------------
fn ReadFaces fileXFile aRenderGroups =
(
	-- Skip the blank line
	lineStream = ReadLine fileXFile as StringStream

	nTotalFaces = 0
	nXFileFaces = ReadValue ( ReadLine fileXFile as StringStream ) as integer
	nBaseVertex = -1
	
	for nGroupIndex=1 to aRenderGroups.count do
	(
		nFaceCount = aRenderGroups[ nGroupIndex ].maxMesh.numFaces
		nMaterialIndex = aRenderGroups[ nGroupIndex ].nMaterialIndex + 1
		
		for nFaceIndex=1 to nFaceCount do
		(
			-- Read The Vertex Indices Used By The Face
			lineStream = (ReadLine fileXFile) as StringStream
			
			if( 3 == ReadValue lineStream as integer ) then
			(
				face = Point3											\
					( ReadValue lineStream as integer - nBaseVertex )	\
					( ReadValue lineStream as integer - nBaseVertex )	\
					( ReadValue lineStream as integer - nBaseVertex )

				SetFace aRenderGroups[ nGroupIndex ].maxMesh nFaceIndex face.x face.z face.y
				SetFaceMatID aRenderGroups[ nGroupIndex ].maxMesh nFaceIndex nMaterialIndex
			)
			else
			(
				MessageBox "Error : Only Faces With 3 Sides Are Supported"
				exit
			)
		)
		
		nTotalFaces += nFaceCount
		nBaseVertex += aRenderGroups[ nGroupIndex ].maxMesh.numVerts
	)
	
	if( nTotalFaces != nXFileFaces ) do
		Format "Error : Mesh Has % Faces, Groups Total % Faces\n" nXFileFaces nTotalFaces
)

--------------------------------------------------------------------------------------
--- Write The Faces For All Render Groups
--------------------------------------------------------------------------------------
fn WriteFaces fileOut aObjectSet uMeshCount uFaceCount strIndent =
(
	uCurrentMesh = 0
	nFaceBaseVertexIndex = -1
	Format "%%;\n" strIndent uFaceCount to:fileOut
	
	for uGroupIndex=1 to aObjectSet.count do
	(
		mesh = aObjectSet[ uGroupIndex ]
				
		if( "Editable_mesh" == classof mesh.baseobject as string ) do
		(
			nGroupFaces = mesh.faces.count
			uCurrentMesh += 1
	
			if( uCurrentMesh == uMeshCount ) do
				nGroupFaces -= 1
			
			for nFaceIndex=1 to nGroupFaces do
			(
				pt3Face = GetFace mesh nFaceIndex
				Format "%3;%,%,%;,\n" strIndent	( pt3Face.x as integer + nFaceBaseVertexIndex ) 	\
									  			( pt3Face.z as integer + nFaceBaseVertexIndex ) 	\
									  			( pt3Face.y as integer + nFaceBaseVertexIndex ) to:fileOut
			)
			
			if( uCurrentMesh == uMeshCount ) do
			(
				pt3Face = GetFace mesh mesh.faces.count
				Format "%3;%,%,%;;\n" strIndent ( pt3Face.x as integer + nFaceBaseVertexIndex ) 	\
									 	  		( pt3Face.z as integer + nFaceBaseVertexIndex ) 	\
										   		( pt3Face.y as integer + nFaceBaseVertexIndex ) to:fileOut
		   	)
			
			nFaceBaseVertexIndex += mesh.verts.count
		)
	)
)

--------------------------------------------------------------------------------------
--- Read The Vertex Normals For All Render Groups
--------------------------------------------------------------------------------------
fn ReadNormals fileXFile aRenderGroups =
(
	if( FindNextToken fileXFile "MeshNormals" ) and ( FindNextToken fileXFile "{" ) do
	(
		nTotalNormals = 0
		nXFileNormals = ReadValue ( ReadLine fileXFile as StringStream ) as integer

		for nGroupIndex=1 to aRenderGroups.count do
		(
--			normalModifier = editNormals()
--			Select aRenderGroups[ nGroupIndex ].maxMesh
--			AddModifier aRenderGroups[ nGroupIndex ].maxMesh normalModifier
--			ModPanel.SetCurrentObject normalModifier
--			normalModifier.selectBy = 0

			nNormalCount = aRenderGroups[ nGroupIndex ].maxMesh.numVerts

			for nNormalIndex = 1 to nNormalCount do
			(
				lineStream = ReadLine fileXFile as StringStream

				normal = Point3							\
					( ReadValue lineStream as float )	\
					( ReadValue lineStream as float )	\
					( ReadValue lineStream as float )
				
--				normalModifier.SetNormalExplicit nNormalIndex
--				normalModifier.SetNormal nNormalIndex ( Point3 normal.x normal.z normal.y )
			)
			
			nTotalNormals += nNormalCount
		)

		if( nTotalNormals != nXFileNormals ) do
		(
			MessageBox "Error : Normal Count Must Match Vertex Count"
		)
	)
)

--------------------------------------------------------------------------------------
--- Write The Vertex Normals For All Render Groups
--------------------------------------------------------------------------------------
fn WriteNormals fileOut aObjectSet uMeshCount uVertexCount uFaceCount =
(
	uCurrentMesh = 0
	Format "\n\t\tMeshNormals\n\t\t{\n\t\t\t%;\n" uVertexCount to:fileOut
	
	for uGroupIndex=1 to aObjectSet.count do
	(
		mesh = aObjectSet[ uGroupIndex ]
		if( "Editable_mesh" == classof mesh.baseobject as string ) do
		(
			uGroupVerts = mesh.verts.count
			uCurrentMesh += 1
			
			if( uCurrentMesh == uMeshCount ) do
				uGroupVerts -= 1
		
			for uNormalIndex=1 to uGroupVerts do
			(
				vec3Normal = GetNormal mesh uNormalIndex
				Format "\t\t\t%;%;%;,\n" ( PrintFloat vec3Normal.x )		\
										 ( PrintFloat vec3Normal.z )		\
										 ( PrintFloat vec3Normal.y ) to:fileOut
			)
			
			if( uCurrentMesh == uMeshCount ) do
			(
				vec3Normal = GetNormal mesh mesh.verts.count
				Format "\t\t\t%;%;%;;\n\n" ( PrintFloat vec3Normal.x )		\
										   ( PrintFloat vec3Normal.z )		\
										   ( PrintFloat vec3Normal.y ) to:fileOut
			)
		)
	)
	
	WriteFaces fileOut aObjectSet uMeshCount uFaceCount "\t\t\t"
	Format "\t\t}\n\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Read The Texture UV's For The Current Mesh
--------------------------------------------------------------------------------------
fn ReadTextureUVs fileXFile aRenderGroups =
(
	if( FindNextToken fileXFile "MeshTextureCoords" ) and ( FindNextToken fileXFile "{" ) do
	(
		nTotalUVs = 0
		nXFileUVs = ReadValue ( ReadLine fileXFile as StringStream ) as integer
		
		for nGroupIndex=1 to aRenderGroups.count do
		(
			MeshOp.DefaultMapFaces aRenderGroups[ nGroupIndex ].maxMesh 1
			nUVCount = aRenderGroups[ nGroupIndex ].maxMesh.numVerts

			for nUVIndex = 1 to nUVCount do
			(
				lineStream = ReadLine fileXFile as StringStream
				uv = Point3 ( ReadValue lineStream as float ) -( ReadValue lineStream as float ) 0.0
				MeshOp.SetMapVert aRenderGroups[ nGroupIndex ].maxMesh 1 nUVIndex uv
			)
			nTotalUVs += nUVCount
		)
		
		if( nTotalUVs != nXFileUVs ) do
			MessageBox "Error : UV Count Must Match Vertex Count"
	)
)

--------------------------------------------------------------------------------------
--- Write The Texture UV's For The Current Mesh
--------------------------------------------------------------------------------------
fn WriteTextureUVs fileOut aObjectSet uMeshCount uVertexCount =
(
	uCurrentMesh = 0
	Format "\t\tMeshTextureCoords\n\t\t{\n\t\t\t%;\n" uVertexCount to:fileOut
	
	for uGroupIndex=1 to aObjectSet.count do
	(
		mesh = aObjectSet[ uGroupIndex ]
		if( "Editable_mesh" == classof mesh.baseobject as string ) do
		(
			uGroupVerts = mesh.verts.count
			uCurrentMesh += 1

			if( uCurrentMesh == uMeshCount ) do
				uGroupVerts -= 1

			for uUVIndex=1 to uGroupVerts do
			(
				pt3UV = MeshOp.GetMapVert mesh 1 uUVIndex
				Format "\t\t\t%;%;,\n" pt3UV.x -pt3UV.y to:fileOut
			)
			
			if( uCurrentMesh == uMeshCount ) do
			(
				pt3UV = MeshOp.GetMapVert mesh 1 mesh.verts.count
				Format "\t\t\t%;%;;\n" pt3UV.x -pt3UV.y to:fileOut
			)
		)
	)

	Format "\t\t}\n\t}\n\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Read The Materials From The X File
--------------------------------------------------------------------------------------
fn ReadMaterials fileXFile strPathName =
(
	if( FindNextToken fileXFile "MeshMaterialList" ) and ( FindNextToken fileXFile "{" ) do
	(
		g_strCurrentLine = ReadLine fileXFile
		g_aCurrentLineTokens = FilterString g_strCurrentLine " \t;"
		
		if( 2 == g_aCurrentLineTokens.count ) then
		(
			newMaterial = MultiMaterial numSubs:1
			nMaterialCount = g_aCurrentLineTokens[ 1 ] as integer
			
			for nMaterialIndex=1 to nMaterialCount do
			(
				if( FindNextToken fileXFile "TextureFilename" ) and ( FindNextToken fileXFile "{" ) do
				(
					g_aCurrentLineTokens = FilterString g_strCurrentLine "\""
					
					if( 3 == g_aCurrentLineTokens.count ) do
					(
						strFileName = strPathName + g_aCurrentLineTokens[ 2 ]
						strTextureName = GetFileNameFile strFileName
						Format "Material Using Texture %\n" strTextureName

						newSubMaterial = StandardMaterial name:strTextureName twoSided:true opacity:100.0
						newSubMaterial.diffuseMap = BitMapTexture name:strTextureName
						newSubMaterial.diffuseMap.fileName = strFileName
						newMaterial.materialList[ nMaterialIndex ] = newSubMaterial
						ShowTextureMap newSubMaterial newSubMaterial.diffuseMap true
					)
				)
			)

			g_strCurrentLine = ReadLine fileXFile
			g_strCurrentLine = ReadLine fileXFile
			return newMaterial
		)
		else
		(
			Format "Error In X File - Expected 2 Tokens Found %\n" g_aCurrentLineTokens.count
		)
	)

	return undefined
)

--------------------------------------------------------------------------------------
--- Write The Materials To The X File
--------------------------------------------------------------------------------------
fn WriteMaterials fileOut aObjectSet uMeshCount uMaterialCount uFaceCount =
(
	aMaterialList = #()
	aMaterialList.count = uMaterialCount
	uCurrentMaterial = 0
	
	Format "\t\tMeshMaterialList\n\t\t{\n" to:fileOut
	Format "\t\t\t%;%;\n" uMaterialCount uFaceCount to:fileOut
		
	for uGroupIndex=1 to aObjectSet.count do
	(
		if( "Editable_mesh" == classof aObjectSet[ uGroupIndex ].baseobject as string ) do
		(
			uCurrentMaterial += 1
			Format "\t\t\t" to:fileOut
			uFaceCount = aObjectSet[ uGroupIndex ].numFaces - 1
			uMaterialIndex = GetFaceMatID aObjectSet[ uGroupIndex ] 1
			
			if( undefined == aMaterialList[ uMaterialIndex ] ) do
			(
				strFilePath = aObjectSet[ uGroupIndex ].material.materialList[ uMaterialIndex ].diffuseMap.fileName
				aMaterialList[ uMaterialIndex ] = GetFilenameFile strFilePath
			)
		
			for uFaceIndex=1 to uFaceCount do
				Format "%," ( uMaterialIndex - 1 ) to:fileOut

			if( uCurrentMaterial == uMeshCount ) then
				Format "%;\n" ( uMaterialIndex - 1 ) to:fileOut
			else
				Format "%,\n" ( uMaterialIndex - 1 ) to:fileOut
		)
	)
	
	for uMaterialIndex=1 to uMaterialCount do
	(
		Format "\n\t\t\tMaterial\n\t\t\t{\n" to:fileOut
		Format "\t\t\t\t1.000000;1.000000;1.000000;1.000000;;\n" to:fileOut
		Format "\t\t\t\t0.000000;\n" to:fileOut
		Format "\t\t\t\t0.000000;0.000000;0.000000;;\n" to:fileOut
		Format "\t\t\t\t0.000000;0.000000;0.000000;;\n" to:fileOut
		Format "\t\t\t\tTextureFilename { \"%.tga\"; }\n" aMaterialList[ uMaterialIndex ] to:fileOut
		Format "\t\t\t}\n" to:fileOut
	)

	Format "\t\t}\n\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Read My Custom Render Groups
--------------------------------------------------------------------------------------
fn ReadRenderGroups fileXFile aRenderGroups newMaterial =
(
	if( FindNextToken fileXFile "MeshRenderGroupList" ) and ( FindNextToken fileXFile "{" ) do
	(
		g_strCurrentLine = ReadLine fileXFile
		g_aCurrentLineTokens = FilterString g_strCurrentLine " \t;"
		aRenderGroups.count = g_aCurrentLineTokens[ 1 ] as integer
		Format "Render Group Count = %\n" aRenderGroups.count
		
		for uRenderGroupIndex=1 to aRenderGroups.count do
		(
			if( FindNextToken fileXFile "RenderGroup" ) then
			(
				ReadLine fileXFile	-- Skip The {
				
				aRenderGroups[ uRenderGroupIndex ] = ( RenderGroup									\
					maxMesh:( Mesh																	\
						numVerts:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )	\
						numFaces:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )	\
						name:g_aCurrentLineTokens[ 2 ]												\
						material:newMaterial														\
					)																				\
					nMaterialIndex:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )	\
					nBlendMode:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )		\
					bDoubleSided:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )	\
					bFullBright:( ReadValue ( ReadLine fileXFile as StringStream ) as integer )		\
				)
				
				if( 0 != aRenderGroups[ uRenderGroupIndex ].bDoubleSided ) do
					aRenderGroups[ uRenderGroupIndex ].maxMesh.backfacecull = false

				if( g_bTransparentMesh ) do
					aRenderGroups[ uRenderGroupIndex ].maxMesh.xray = true

				Format "Found Render Group %\n" g_aCurrentLineTokens[ 2 ]
			)
			else
			(
				Format "Error In X File - Expected % Render Groups Found %\n" aRenderGroups.count (uRenderGroupIndex - 1)
			)
		)
		
		ReadLine fileXFile	-- Skip The } At The End Of The Last RenderGroup
		ReadLine fileXFile	-- Skip The } At The End Of MeshRenderGroupList
		
		-- Skip Any Empty Lines
		do
		(
			g_strCurrentLine = ReadLine fileXFile
			g_aCurrentLineTokens = FilterString g_strCurrentLine " \t;"
		) while 0 == g_aCurrentLineTokens.count
		
--		Format "DEBUG Token Count % Current Line %\n" g_aCurrentLineTokens.count g_strCurrentLine
	)
)

--------------------------------------------------------------------------------------
--- Write My Custom Render Groups
--------------------------------------------------------------------------------------
fn WriteRenderGroups fileOut aObjectSet uMeshCount =
(
	Format "\t\tMeshRenderGroupList\n\t\t{\n" to:fileOut
	Format "\t\t\t%;\n" uMeshCount to:fileOut

	for uObjectIndex=1 to objects.count do
	(
		if( "Editable_mesh" == classof aObjectSet[ uObjectIndex ].baseobject as string ) do
		(
			Format "\n\t\t\tRenderGroup %\n\t\t\t{\n" aObjectSet[ uObjectIndex ].name to:fileOut
			Format "\t\t\t\t%;\n" aObjectSet[ uObjectIndex ].numVerts to:fileOut
			Format "\t\t\t\t%;\n" aObjectSet[ uObjectIndex ].numFaces to:fileOut
			Format "\t\t\t\t%;\n" ( GetFaceMatID aObjectSet[ uObjectIndex ] 1 - 1 ) to:fileOut
			Format "\t\t\t\t0;\t\t// TODO: Export Correct uBlendMode\n" to:fileOut
			Format "\t\t\t\t0;\t\t// TODO: Export Correct bDoubleSided Flag\n" to:fileOut
			Format "\t\t\t\t0;\t\t// TODO: Export Correct bFullBright Flag\n" to:fileOut
			Format "\t\t\t}\n" to:fileOut
		)
	)	
	
	Format "\t\t}\n\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Read The Skin Header Block
--------------------------------------------------------------------------------------
fn ReadSkinHeader fileXFile =
(
	nBoneCount = 0
	if( FindNextToken fileXFile "{" ) do
	(
		nMaxWeightsPerVertex = ReadValue ( ReadLine fileXFile as StringStream ) as integer
		nMaxWeightsPerFace = ReadValue ( ReadLine fileXFile as StringStream ) as integer
		nBoneCount = ReadValue ( ReadLine fileXFile as StringStream ) as integer
		Format "Bones %  Max Weights Per Vert %  Max Weights Per Face %\n" nBoneCount nMaxWeightsPerVertex nMaxWeightsPerFace
	)

	return nBoneCount
)

--------------------------------------------------------------------------------------
--- Write The Skin Header Block
--------------------------------------------------------------------------------------
fn WriteSkinHeader fileOut uBoneCount =
(
	Format "\tXSkinMeshHeader\n\t{\n" to:fileOut
	Format "\t\t4;\n\t\t12;\n" to:fileOut
	Format "\t\t%;\n\t}\n\n" (uBoneCount + 1) to:fileOut
)

--------------------------------------------------------------------------------------
--- Read The Skeleton Hierarchy
--------------------------------------------------------------------------------------
fn ReadSkeletonHierarchy fileXFile aSkeletonHierarchy =
(
	g_nCurrentTokenIndex = 0	-- Reset The Current Token Index So We Find The Root Frame
	nHierarchyLevel = 0
	bFoundSceneRoot = false
	aParentIndex = #()

	while( true ) do
	(
		aTokenSet = #( "{", "}", "BoneInfo", "Frame", "FrameTransformMatrix" )
		case( FindTokenInSet fileXFile aTokenSet ) of
		(
			0:(
				MessageBox "Error! Unexpected End Of File In Bone Hierarchy"
				exit
			)
			
			1:(		-- "{"
				nHierarchyLevel += 1
--				Format "Set Parent At Level % To Bone %\n" nHierarchyLevel aSkeletonHierarchy.count
				aParentIndex[ nHierarchyLevel ]	= aSkeletonHierarchy.count
			)
			2:(		-- "}"
				nHierarchyLevel -= 1
				if( 0 == nHierarchyLevel ) do
				(
					Format "Hierarchy Contains % Frames\n" aSkeletonHierarchy.count
					exit
				)
			)
			3:(		-- "BoneInfo"
				FindNextToken fileXFile "{"
				uCurrentBoneIndex = aSkeletonHierarchy.count
				
				lineStream = ReadLine fileXFile as StringStream
				aSkeletonHierarchy[ uCurrentBoneIndex ].v3BoneEnd =		\
					Point3	( ReadValue lineStream as float )			\
							( ReadValue lineStream as float )			\
							( ReadValue lineStream as float )
		
				lineStream = ReadLine fileXFile as StringStream
				aSkeletonHierarchy[ uCurrentBoneIndex ].v2BoneScale =	\
					Point2	( ReadValue lineStream as float )			\
							( ReadValue lineStream as float )

				lineStream = ReadLine fileXFile as StringStream
				aSkeletonHierarchy[ uCurrentBoneIndex ].v4BoneARGB =	\
					Color_RGBA	a:( ReadValue lineStream as float )		\
								r:( ReadValue lineStream as float )		\
								g:( ReadValue lineStream as float )		\
								b:( ReadValue lineStream as float )
				
				FindNextToken fileXFile "}"
			)
			4:(		-- "Frame"
				strFrameName = GetNextTokenOnCurrentLine()
				if( bFoundSceneRoot ) then
				(
					append aSkeletonHierarchy ( SkeletonNode() )
				)
				else
				(
					if( strFrameName == "SceneRootRigid" ) then
					(
						Format "Found Rigid Mesh\n"
						exit
					)
					else if( strFrameName != "SceneRootSkinned" ) do
					(
						MessageBox "Unexpected Frame Encountered!"
					)
				
					FindNextToken fileXFile "{"
					bFoundSceneRoot = true;
				)
			)
			5:(		-- "FrameTransformMatrix"
				if( FindNextToken fileXFile "{" ) then
				(
					uCurrentBoneIndex = aSkeletonHierarchy.count

					if( nHierarchyLevel > 1 ) then
					(
						nParentIndex = aParentIndex[ nHierarchyLevel - 1 ]
--						Format "Frame % Parent %\n" strFrameName aSkeletonHierarchy[ nParentIndex ].strBoneName
						aSkeletonHierarchy[ uCurrentBoneIndex ].mat34Bone = 		\
							ReadMatrix44 ( ReadLine fileXFile as StringStream ) * 	\
							aSkeletonHierarchy[ nParentIndex ].mat34Bone
					)
					else
					(
						nParentIndex = 0
--						Format "Root Frame %\n" strFrameName
						aSkeletonHierarchy[ uCurrentBoneIndex ].mat34Bone = ReadMatrix44 ( ReadLine fileXFile as StringStream )
					)

					aSkeletonHierarchy[ uCurrentBoneIndex ].strBoneName = strFrameName
					aSkeletonHierarchy[ uCurrentBoneIndex ].nParentIndex = nParentIndex

					if( 0 == FindNextToken fileXFile "}" ) do
					(
						MessageBox "Expecting '}' Skeleton Appears Corrupt!"
						exit
					)
				)
				else
				(
					MessageBox "Expecting '{' Skeleton Appears Corrupt!"
					exit
				)
			)
		)
	)
)

--------------------------------------------------------------------------------------
--- Write The Skeleton Hierarchy
--------------------------------------------------------------------------------------
fn WriteSkeletonHierarchy fileOut =
(
	Format "\t// TODO: Export The Skeleton Hierarchy Here\n\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Build Skeleton
--------------------------------------------------------------------------------------
fn BuildSkeleton aSkeletonHierarchy =
(
	for nBoneIndex = 1 to aSkeletonHierarchy.count do
	(
		vec3Start = aSkeletonHierarchy[ nBoneIndex ].mat34Bone.row4
--		vec3Start = ( Point3 0.0 0.0 0.0 ) * aSkeletonHierarchy[ nBoneIndex ].mat34Bone
		vec3End = vec3Start + aSkeletonHierarchy[ nBoneIndex ].v3BoneEnd

		aSkeletonHierarchy[ nBoneIndex ].maxBone = 								\
			BoneSys.CreateBone	( Point3 vec3Start.x vec3Start.z vec3Start.y )	\
								( Point3 vec3End.x vec3End.z vec3End.y ) 		\
								( z_axis )

		aSkeletonHierarchy[ nBoneIndex ].maxBone.wireColor = 					\
			Color	( aSkeletonHierarchy[ nBoneIndex ].v4BoneARGB.r * 255.0 )	\
					( aSkeletonHierarchy[ nBoneIndex ].v4BoneARGB.g * 255.0 )	\
					( aSkeletonHierarchy[ nBoneIndex ].v4BoneARGB.b * 255.0 )

		if( g_bHideUnusedBones and ( aSkeletonHierarchy[ nBoneIndex ].v4BoneARGB.a < 1.0 )) do
			aSkeletonHierarchy[ nBoneIndex ].maxBone.isHidden = true

--		aSkeletonHierarchy[ nBoneIndex ].maxBone.showLinks = true
--		aSkeletonHierarchy[ nBoneIndex ].maxBone.showLinksOnly = true
		aSkeletonHierarchy[ nBoneIndex ].maxBone.width = aSkeletonHierarchy[ nBoneIndex ].v2BoneScale.x
		aSkeletonHierarchy[ nBoneIndex ].maxBone.height = aSkeletonHierarchy[ nBoneIndex ].v2BoneScale.y
		aSkeletonHierarchy[ nBoneIndex ].maxBone.name = aSkeletonHierarchy[ nBoneIndex ].strBoneName

		if( nBoneIndex > 1 ) do
		(
			nParentIndex = aSkeletonHierarchy[ nBoneIndex ].nParentIndex
			aSkeletonHierarchy[ nBoneIndex ].maxBone.parent = aSkeletonHierarchy[ nParentIndex ].maxBone
		)
	)
)

--------------------------------------------------------------------------------------
--- Read Vertex Weights
--------------------------------------------------------------------------------------
fn ReadWeights fileXFile aRenderGroups aSkeletonHierarchy aVertexWeights =
(
	g_nCurrentTokenIndex = 0	-- Reset The Current Token Index So We Find The First Skin Weight

	while( FindNextToken fileXFile "SkinWeights" ) do
	(
		FindNextToken fileXFile "{"

		-- Read The Bone Name
		g_strCurrentLine = ReadLine fileXFile
		g_aCurrentLineTokens = FilterString g_strCurrentLine "\""
		szBoneName = g_aCurrentLineTokens[ 2 ]

		-- Read The Vertices Weighted To This Bone
		aWeightedVerts = #()
		aWeightedVerts.count = ReadValue ( ReadLine fileXFile as StringStream ) as integer
		for nVertexIndex = 1 to aWeightedVerts.count do
			aWeightedVerts[ nVertexIndex ] = ReadValue ( ReadLine fileXFile as StringStream ) as integer

		-- Find The Named Bone In The Hierarchy
		bFoundBone = false
		for nBoneIndex = 1 to aSkeletonHierarchy.count do
		(
			if( szBoneName == aSkeletonHierarchy[ nBoneIndex ].strBoneName ) do
			(
				for nVertexIndex = 1 to aWeightedVerts.count do
				(
					nWeightedVertex = aWeightedVerts[ nVertexIndex ] + 1
					fWeight = ReadValue ( ReadLine fileXFile as StringStream ) as float
					append aVertexWeights[ nWeightedVertex ].aBoneIndecies nBoneIndex
					append aVertexWeights[ nWeightedVertex ].aWeights fWeight
				)
				bFoundBone = true
				exit
			)
		)

		if( false == bFoundBone ) do
			MessageBox ( "Weighted " + szBoneName + " Not Found In Hierarchy\n" )

		FindNextToken fileXFile "}"
	)
)

--------------------------------------------------------------------------------------
--- Skin Skeleton
--------------------------------------------------------------------------------------
fn SkinSkeleton aRenderGroups aSkeletonHierarchy aVertexWeights =
(
	max modify mode

	aBoneUsed = #()
	uTotalBoneCount = aSkeletonHierarchy.count
	aBoneUsed.count = uTotalBoneCount
	uBaseVertex = 0

	for uGroupIndex=1 to aRenderGroups.count do
	(
		uVertexCount = aRenderGroups[ uGroupIndex ].maxMesh.numVerts

		-- Find The Bones Used By This Render Group
		for uBoneIndex=1 to uTotalBoneCount do
			aBoneUsed[ uBoneIndex ] = undefined

		for uVertexIndex=1 to uVertexCount do
		(
			uCurrentVertex = uBaseVertex + uVertexIndex
			if( undefined != aVertexWeights[ uCurrentVertex ] ) then
			(
				uBoneIndexCount = aVertexWeights[ uCurrentVertex ].aBoneIndecies.count
				for uBoneIndex=1 to uBoneIndexCount do
					aBoneUsed[ aVertexWeights[ uCurrentVertex ].aBoneIndecies[ uBoneIndex ] ] = 0
			)
			else
			(
				Format "DEBUG - Vertex % Not Weighted To Any Bone\n" uCurrentVertex
				aVertexWeights[ uCurrentVertex ] = VertexWeight()
				append aVertexWeights[ uCurrentVertex ].aBoneIndecies 1
				append aVertexWeights[ uCurrentVertex ].aWeights 1.0
			)
		)

		-- Add The Required Bones To The Skin
		skinModifier = skin()
		Select aRenderGroups[ uGroupIndex ].maxMesh
		AddModifier aRenderGroups[ uGroupIndex ].maxMesh skinModifier
		
		uCurrentBone = 0

		for uBoneIndex=1 to uTotalBoneCount do
		(
			if( 0 == aBoneUsed[ uBoneIndex ] ) do
			(
				uCurrentBone += 1
				SkinOps.AddBone skinModifier aSkeletonHierarchy[ uBoneIndex ].maxBone 0
				aBoneUsed[ uBoneIndex ] = uCurrentBone
			)
		)
		
		-- Weight All Vertices To The Skeleton
		Format "Render Group % Weighted To % Bones\n" aRenderGroups[ uGroupIndex ].maxMesh.name uCurrentBone
		ModPanel.SetCurrentObject skinModifier
		for uVertexIndex=1 to uVertexCount do
		(
			-- Remap The Bones Used By This Render Group
			uCurrentVertex = uBaseVertex + uVertexIndex
			uBoneIndexCount = aVertexWeights[ uCurrentVertex ].aBoneIndecies.count
			for uBoneIndex=1 to uBoneIndexCount do
			(
				uSourceBone = aVertexWeights[ uCurrentVertex ].aBoneIndecies[ uBoneIndex ]
				if( uSourceBone > uTotalBoneCount ) do
				(
					Format "DEBUG - Vertex % Weighted To Invaild Bone %\n" uCurrentVertex uSourceBone
					uSourceBone = uTotalBoneCount
				)
				aVertexWeights[ uCurrentVertex ].aBoneIndecies[ uBoneIndex ] = aBoneUsed[ uSourceBone ]
			)
		
			SkinOps.ReplaceVertexWeights 						\
				skinModifier									\
				uVertexIndex 									\
				aVertexWeights[ uCurrentVertex ].aBoneIndecies	\
				aVertexWeights[ uCurrentVertex ].aWeights
		)
		
		uBaseVertex += uVertexCount
	)
)

--------------------------------------------------------------------------------------
--- Write Vertex Skin Weights
--------------------------------------------------------------------------------------
fn WriteSkinWeights fileOut =
(
	Format "\t// TODO: Write Skin Vertex Weights Here\n" to:fileOut
)

--------------------------------------------------------------------------------------
--- Import X File
--------------------------------------------------------------------------------------
fn XFileImport =
(
	undo off
	ClearListener() 
	set coordsys world
	strXFileName = GetOpenFileName caption:"Import X File" types:"X Files (*.x)|*.x|All (*.*)|*.*|"

	if( undefined != strXFileName ) do
	(
		if( DoesFileExist strXFileName ) then
		(
			bValidXFile = false
			fileXFile = OpenFile strXFileName
			DisableSceneRedraw()

			-- Verify The X File Header
			if( false == eof fileXFile ) do
			(
				lineTokens = FilterString (ReadLine fileXFile) " \t"

				if( "xof" == lineTokens[ 1 ] ) and
				  ( "0303txt" == lineTokens[ 2 ] ) and
				  ( "0032" == lineTokens[ 3 ] ) do
				(
					bValidXFile = true
				)
			)

			if( bValidXFile ) then
			(
				aSkeletonHierarchy = #()
				aVertexWeights = #()
				aRenderGroups = #()

				while( true ) do
				(
					aTokenSet = #( "Frame", "Mesh", "SkinWeights", "Template", "XFileVersion", "XSkinMeshHeader" )
					case( FindTokenInSet fileXFile aTokenSet ) of
					(
						0:( 	-- End Of File
							if( aSkeletonHierarchy.count > 0 ) do
								SkinSkeleton aRenderGroups aSkeletonHierarchy aVertexWeights

							Print "Reached Final Token In File"
							exit
						)
						1:(		-- "Frame"
							ReadSkeletonHierarchy fileXFile aSkeletonHierarchy
							BuildSkeleton aSkeletonHierarchy
						)
						2:( 	-- "Mesh"
							materials = ReadMaterials fileXFile ( GetFileNamePath strXFileName )
							ReadRenderGroups fileXFile aRenderGroups materials
							aVertexWeights.count = ReadVerts fileXFile aRenderGroups
							
							if( aSkeletonHierarchy.count > 0 ) do
							(
								for nVertexIndex = 1 to aVertexWeights.count do
									aVertexWeights[ nVertexIndex ] = VertexWeight()
							)
	
							ReadFaces fileXFile aRenderGroups
							ReadNormals fileXFile aRenderGroups
							ReadTextureUVs fileXFile aRenderGroups
						)
						3:(		-- "SkinWeights"
							if( 0 != aVertexWeights.count ) then
								ReadWeights fileXFile aRenderGroups aSkeletonHierarchy aVertexWeights
							else
								MessageBox "Error: Found Skin Weights Before Vertices!\n"
						)
						4:(		-- "Template"
							SkipTemplate fileXFile
						)
						5:(		-- "XFileVersion"
							ReadVersion fileXFile
						)
						6:(		-- "XSkinMeshHeader"
							ReadSkinHeader fileXFile
						)
					)
				)
			)
			else
			(
				Format "File % Does Not Seem To Be A Valid X File\n" strXFileName
			)

			Close fileXFile
			EnableSceneRedraw()
			
			for nGroupIndex=1 to aRenderGroups.count do
			(
				if( g_bFreezeSkin ) do
				(
					aRenderGroups[ nGroupIndex ].maxMesh.isFrozen = true
					aRenderGroups[ nGroupIndex ].maxMesh.showFrozenInGray = false
				)

				MeshOps.collapse aRenderGroups[ nGroupIndex ].maxMesh
				
				Update aRenderGroups[ nGroupIndex ].maxMesh
			)
	
		)
		else
		(
			Format "Error Opening File %\n" strXFileName
		)
	)
)

--------------------------------------------------------------------------------------
--- Export X File
--------------------------------------------------------------------------------------
fn XFileExport =
(
	uBoneCount = 0
	uMeshCount = 0
	uFaceCount = 0
	uVertexCount = 0
	uMaterialCount = 0
	aObjectSet = #()
	set coordsys world

	if( g_bSelectAllObjects ) then
	(
		aObjectSet.count = objects.count
		for uObjectIndex=1 to objects.count do
			aObjectSet[ uObjectIndex ] = objects[ uObjectIndex ]
	)
	else
	(
		aObjectSet = GetCurrentSelection()
	)

	for uSelectionIndex=1 to aObjectSet.count do
	(
		strSelectionClass = classof aObjectSet[ uSelectionIndex ].baseobject as string
--		Format "Selection % Is %\n" uSelectionIndex strSelectionClass

		if( "BoneGeometry" == strSelectionClass ) do
			uBoneCount += 1

		if( "Editable_mesh" == strSelectionClass ) do
		(
			uMaterialID = GetFaceMatID aObjectSet[ uSelectionIndex ] 1
			if( uMaterialID > uMaterialCount ) do
				uMaterialCount = uMaterialID

			uVertexCount += aObjectSet[ uSelectionIndex ].verts.count
			uFaceCount += aObjectSet[ uSelectionIndex ].faces.count
			uMeshCount += 1
		)
	)

	if( aObjectSet.count != ( uBoneCount + uMeshCount )) do
		Format "Warning Skipped % Unknown Selected Objects\n" ( aObjectSet.count - uBoneCount - uMeshCount )

	Format "Processing % Mesh Groups With % Bones\n" uMeshCount uBoneCount

	if( 0 == uMeshCount ) do
	(
		MessageBox "No Mesh Selected"
		return undefined
	)

	strFileName = GetSaveFileName caption:"Export X File" types:"X Files (*.x)|*.x|"

	if( undefined != strFileName ) do
	(
		fileOut = CreateFile strFileName
		WriteHeader fileOut
		WriteSkeletonHierarchy fileOut
		Format "\tMesh %\n\t{\n" ( GetFilenameFile strFileName ) to:fileOut
		WriteMaterials fileOut aObjectSet uMeshCount uMaterialCount uFaceCount
		WriteRenderGroups fileOut aObjectSet uMeshCount
		WriteVerts fileOut aObjectSet uMeshCount uVertexCount
		WriteFaces fileOut aObjectSet uMeshCount uFaceCount "\t\t"
		WriteNormals fileOut aObjectSet uMeshCount uVertexCount uFaceCount
		WriteTextureUVs fileOut aObjectSet uMeshCount uVertexCount
		WriteSkinHeader fileOut uBoneCount
		WriteSkinWeights fileOut
		Format "}\n" to:fileOut
		Close fileOut
	)
)

--------------------------------------------------------------------------------------
--- Cleanup
--------------------------------------------------------------------------------------
if( undefined != floaterXFile ) do
(
	CloseRolloutFloater floaterXFile
)

-- If The Script Crashed On A Previous Run, Redraw May Have Been Left Disabled
while( IsSceneRedrawDisabled() ) do
(
	EnableSceneRedraw()
)

--------------------------------------------------------------------------------------
--- Direct X File Importer
--------------------------------------------------------------------------------------
rollout RolloutImportXFile "Importer" width:184 height:236
(
	checkbox chkHideUnusedBones "Hide Unused Bones" pos:[40,7] width:120 height:16 checked:g_bHideUnusedBones
	checkbox chkTransparentMesh "Transparent Mesh" pos:[40,27] width:120 height:16 checked:g_bTransparentMesh
	checkbox chkFreezeSkin "Freeze Skin" pos:[40,47] width:120 height:16 checked:g_bFreezeSkin
	button import_btn "Import X File..." pos:[18,73] width:147 height:32

	on import_btn pressed do
		XFileImport()

	on chkHideUnusedBones changed state do
		g_bHideUnusedBones = chkHideUnusedBones.checked

	on chkTransparentMesh changed state do
		g_bTransparentMesh = chkTransparentMesh.checked

	on chkFreezeSkin changed state do
		g_bFreezeSkin = chkFreezeSkin.checked
)

--------------------------------------------------------------------------------------
--- Direct X File Exporter
--------------------------------------------------------------------------------------
rollout RolloutExportXFile "Exporter" width:184 height:196
(
	checkbox chkSelectAll "Auto Select All" pos:[48,7] width:109 height:16 checked:true
	button export_btn "Export X File..." pos:[18,30] width:147 height:32
	
	on export_btn pressed do
		XFileExport()

	on chkSelectAll changed state do
		g_bSelectAllObjects = chkSelectAll.checked
)

--------------------------------------------------------------------------------------
--- Initialisation
--------------------------------------------------------------------------------------
floaterXFile = NewRolloutFloater "X File Max Script" 210 233
AddRollout RolloutImportXFile floaterXFile
AddRollout RolloutExportXFile floaterXFile
