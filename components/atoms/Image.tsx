exports.detailedreport = async function (req, res) {
  console.log(req.body, "detailedreport");
  let sequelize;
  try {
    sequelize = await dbname(req, req.headers.compcode);
    const { loc_code, DATE_FROM, DATE_TO, Channel, Cluster } = req.body;

    if (!loc_code) {
      return res.status(400).send({ message: "loc_code is required" });
    }

    // Location condition
    let locationCondition = "";
    if (Array.isArray(loc_code)) {
      const formatted = loc_code.map((code) => `'${code.replace(/'/g, "''")}'`).join(",");
      locationCondition = `nj.LOC_CODE IN (${formatted})`;
    } else if (typeof loc_code === "string") {
      if (loc_code.includes(",")) {
        locationCondition = `nj.LOC_CODE IN (${loc_code})`;
      } else {
        locationCondition = `nj.LOC_CODE = '${loc_code.replace(/'/g, "''")}'`;
      }
    } else {
      locationCondition = `nj.LOC_CODE = '${loc_code}'`;
    }

    // Date condition
    let dateCondition = "";
    if (DATE_FROM && DATE_TO) {
      dateCondition = `
        AND CAST(nj.APPLICATION_DATE AS DATE) 
        BETWEEN '${DATE_FROM}' AND '${DATE_TO}'
      `;
    }

    // Channel condition - Handle ALL, empty, and comma-separated
    let channelCondition = "";
    if (Channel && Channel.toString().trim() !== "" && Channel !== "ALL") {
      if (Channel.includes(",")) {
        const channelValues = Channel.split(',').map(ch => `'${ch.trim().replace(/'/g, "''")}'`).join(',');
        channelCondition = `AND nj.CHANNEL IN (${channelValues})`;
      } else {
        channelCondition = `AND nj.CHANNEL = '${Channel.replace(/'/g, "''")}'`;
      }
    }

    // Cluster condition - Handle ALL, empty, and comma-separated
    let clusterCondition = "";
    if (Cluster && Cluster.toString().trim() !== "" && Cluster !== "ALL") {
      if (Cluster.includes(",")) {
        const clusterValues = Cluster.split(',').map(cl => `'${cl.trim().replace(/'/g, "''")}'`).join(',');
        clusterCondition = `AND nj.CLUSTER IN (${clusterValues})`;
      } else {
        clusterCondition = `AND nj.CLUSTER = '${Cluster.replace(/'/g, "''")}'`;
      }
    }

    const query = `
      SELECT
          nj.CITY as CITY1,
          (select top 1 Misc_Name 
           from Misc_Mst 
           where Misc_Code = nj.STATE and Misc_Type = 3 AND ISNULL(EXPORT_TYPE, 0) < 3) AS STATE1,
          (select top 1 Misc_Name
           from Misc_Mst
           where Misc_Code = nj.SOURCE_OF_REG and Misc_Type = 17 AND ISNULL(EXPORT_TYPE, 0) < 3) AS SOURCE_OF_REG_Label,
          (select top 1 Misc_Name 
           from Misc_Mst 
           where Misc_Code = nj.RELIGION and Misc_Type = 603 AND ISNULL(EXPORT_TYPE, 0) < 3) AS RELIGION1,
          (select top 1 Misc_Name 
           from Misc_Mst 
           where Misc_Code = nj.LOC_CODE and Misc_Type = 85 AND ISNULL(EXPORT_TYPE, 0) < 3) AS LOC_CODE1,
          (select top 1 Misc_Name
           from Misc_Mst
           where Misc_Code = nj.CLUSTER and Misc_Type = 626 AND ISNULL(EXPORT_TYPE, 0) < 3) AS CLUSTERLabel,
          (select top 1 Misc_Name
           from Misc_Mst
           where Misc_Code = nj.CHANNEL and Misc_Type = 627 AND ISNULL(EXPORT_TYPE, 0) < 3) AS CHANNELLabel,
          CAST(nj.APPLICATION_DATE AS DATE) as APPLICATION_DATE1,
          CAST(nj.DOB AS DATE) as DOB1,
          CAST(nj.DOM AS DATE) as DOM1,
          (select top 1 CONCAT(em1.empfirstname, ' ', em1.emplastname)
           from EMPLOYEEMASTER em1 
           where em1.EMPCODE = nj.INTR1BY) as employeename1,
          (select top 1 CONCAT(em2.empfirstname, ' ', em2.emplastname)
           from EMPLOYEEMASTER em2 
           where em2.EMPCODE = nj.INTR2BY) as employeename2,
          (select top 1 CONCAT(em3.empfirstname, ' ', em3.emplastname)
           from EMPLOYEEMASTER em3 
           where em3.EMPCODE = nj.INTR3BY) as employeename3,
          (select top 1 CONCAT(em4.empfirstname, ' ', em4.emplastname)
           from EMPLOYEEMASTER em4 
           where em4.EMPCODE = nj.INTR4BY) as employeename4,
          sc.VisitStatus,
          sc.VisitType,
          sc.fbackground,
          sc.IsHouse,
          sc.IsCar,
          sc.FMember,
          sc.Foccupation,
          sc.FCondition,
          sc.conclusion,
          sc.CREATED_BY as shortlist_by,
          sc.CREATED_ON as shortlist_date,
          nj.REJECTED_BY,
          CAST(nj.REJECTION_DATE AS DATE) as REJECTION_DATE,
          nj.*
      FROM NEW_JOINING nj
      LEFT JOIN SHORTLISTED_CANDIDATE sc
             ON sc.SRNO = nj.TRAN_ID
      WHERE ${locationCondition}
      ${dateCondition}
      ${channelCondition}
      ${clusterCondition}
    `;

    const [branch] = await sequelize.query(query);

    await sequelize.close();
    res.status(200).send({ data: branch });
  } catch (e) {
    console.error("Error in detailedreport:", e);
    res.status(500).send({ message: "API crashed.", error: e.message });
  }
  finally {
    if (sequelize) await sequelize.close();
  }
};